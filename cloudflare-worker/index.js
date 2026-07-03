/**
 * Content Mood Analyzer - AI keyword-research proxy.
 *
 * Holds the real Gemini API key as a Worker secret (never in this file, never
 * in the plugin's source) and forwards keyword-generation requests to Gemini
 * on behalf of every install of the plugin, so no site needs its own key.
 *
 * Secrets/config (set with `wrangler secret put <NAME>`, never committed):
 *   GEMINI_API_KEY     - the real Gemini API key.
 *   PLUGIN_AUTH_TOKEN   - shared token the plugin sends in X-Plugin-Auth.
 *                         Not a real credential (it ships in the public
 *                         plugin source) - just filters out drive-by
 *                         requests that aren't coming from the plugin.
 * Optional var (wrangler.toml [vars] or a secret, doesn't need to be secret):
 *   GEMINI_MODEL        - defaults to gemini-2.5-flash if unset.
 *
 * Bindings (wrangler.toml):
 *   RATE_LIMIT          - KV namespace used for a simple per-IP daily cap,
 *                         so one caller can't burn the whole shared quota.
 */

const RATE_LIMIT_PER_IP_PER_DAY = 20;

export default {
	async fetch(request, env) {
		if (request.method !== 'POST') {
			return json({ success: false, message: 'Method not allowed.' }, 405);
		}

		const auth = request.headers.get('X-Plugin-Auth');
		if (!env.PLUGIN_AUTH_TOKEN || auth !== env.PLUGIN_AUTH_TOKEN) {
			return json({ success: false, message: 'Unauthorized.' }, 401);
		}

		const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
		const rateLimited = await isRateLimited(env, ip);
		if (rateLimited) {
			return json({ success: false, message: 'Rate limit exceeded. Try again tomorrow.' }, 429);
		}

		let payload;
		try {
			payload = await request.json();
		} catch (err) {
			return json({ success: false, message: 'Invalid JSON body.' }, 400);
		}

		const sentiment = ['positive', 'negative', 'neutral'].includes(payload.sentiment)
			? payload.sentiment
			: 'neutral';
		const categoryPrompt = typeof payload.prompt === 'string' ? payload.prompt.trim() : '';

		if (!categoryPrompt) {
			return json({ success: false, message: 'A category description is required.' }, 400);
		}

		const prompt =
			`List 15-25 single words or short phrases that signal ${sentiment} sentiment in the context of: ${categoryPrompt}\n\n` +
			'Return only the words themselves, lowercase, no explanations.';

		const model = env.GEMINI_MODEL || 'gemini-2.5-flash';
		const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;

		let geminiResponse;
		try {
			geminiResponse = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					contents: [{ parts: [{ text: prompt }] }],
					generationConfig: {
						temperature: 0.4,
						responseMimeType: 'application/json',
						responseSchema: { type: 'ARRAY', items: { type: 'STRING' } },
					},
				}),
			});
		} catch (err) {
			return json({ success: false, message: `Could not reach Gemini: ${err.message}` }, 502);
		}

		await recordRequest(env, ip);

		const body = await geminiResponse.json().catch(() => null);

		if (!geminiResponse.ok) {
			const apiMessage = body?.error?.message;
			return json(
				{
					success: false,
					message: apiMessage
						? `(HTTP ${geminiResponse.status}) ${apiMessage}`
						: `Gemini API request failed with HTTP ${geminiResponse.status}.`,
				},
				502
			);
		}

		const rawText = body?.candidates?.[0]?.content?.parts?.[0]?.text;
		if (!rawText) {
			return json({ success: false, message: 'Gemini returned an empty response.' }, 502);
		}

		let keywords;
		try {
			keywords = JSON.parse(rawText);
		} catch (err) {
			return json({ success: false, message: 'Gemini returned a response in an unexpected format.' }, 502);
		}

		if (!Array.isArray(keywords) || keywords.length === 0) {
			return json({ success: false, message: 'Gemini did not return any usable keywords.' }, 502);
		}

		return json({ success: true, keywords });
	},
};

function json(data, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}

async function isRateLimited(env, ip) {
	if (!env.RATE_LIMIT) {
		return false;
	}
	const key = rateLimitKey(ip);
	const count = parseInt((await env.RATE_LIMIT.get(key)) || '0', 10);
	return count >= RATE_LIMIT_PER_IP_PER_DAY;
}

async function recordRequest(env, ip) {
	if (!env.RATE_LIMIT) {
		return;
	}
	const key = rateLimitKey(ip);
	const count = parseInt((await env.RATE_LIMIT.get(key)) || '0', 10);
	await env.RATE_LIMIT.put(key, String(count + 1), { expirationTtl: 86400 });
}

function rateLimitKey(ip) {
	const today = new Date().toISOString().slice(0, 10);
	return `rl:${ip}:${today}`;
}
