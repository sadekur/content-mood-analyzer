import React, { useEffect, useState } from "react";
import ClearCache from "./components/ClearCache";

const TABS = [
  { key: "general", label: "General" },
  { key: "ai", label: "AI Analysis" },
];

const MODEL_OPTIONS = [
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash (default)" },
  { value: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash-Lite" },
  { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
];

const KEYWORD_FIELDS = [
  {
    key: "positive",
    settingKey: "positive_keywords",
    label: "Positive Keywords",
    placeholder: "e.g., good, great, excellent, wonderful",
    promptPlaceholder: "e.g. Customer & Product Reviews",
  },
  {
    key: "negative",
    settingKey: "negative_keywords",
    label: "Negative Keywords",
    placeholder: "e.g., bad, terrible, awful, poor",
    promptPlaceholder: "e.g. Financial & Economic Context",
  },
  {
    key: "neutral",
    settingKey: "neutral_keywords",
    label: "Neutral Keywords",
    placeholder: "e.g., okay, fine, average, normal",
    promptPlaceholder: "e.g. Weather & Nature",
  },
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState({
    positive_keywords: "",
    negative_keywords: "",
    neutral_keywords: "",
    badge_position: "top",
    ai_provider: "gemini",
    ai_model: "gemini-2.0-flash",
    ai_api_key: "",
    ai_api_key_set: false,
    ai_api_key_last4: "",
    ai_daily_limit: 100,
  });
  const [aiUsage, setAiUsage] = useState(null);
  const [isEditingApiKey, setIsEditingApiKey] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const [keywordPrompts, setKeywordPrompts] = useState({ positive: "", negative: "", neutral: "" });
  const [generatingAll, setGeneratingAll] = useState(false);
  const [generateResult, setGenerateResult] = useState({ positive: null, negative: null, neutral: null });

  // Fetch current settings when component loads
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(CONTENT_MOOD_ANALYZER?.apiUrl + "/settings", {
        headers: {
          "X-WP-Nonce": CONTENT_MOOD_ANALYZER?.nonce,
        },
      });
      const result = await response.json();
      if (result.success) {
        setSettings((prev) => ({ ...prev, ...result.settings }));
        setIsEditingApiKey(!result.settings.ai_api_key_set);
        if (result.ai_usage) {
          setAiUsage(result.ai_usage);
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch(CONTENT_MOOD_ANALYZER?.apiUrl + "/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-WP-Nonce": CONTENT_MOOD_ANALYZER?.nonce,
        },
        body: JSON.stringify(settings),
      });
      const result = await response.json();

      if (result.success) {
        setSettings((prev) => ({ ...prev, ...result.settings }));
        setIsEditingApiKey(!result.settings.ai_api_key_set);
        if (result.ai_usage) {
          setAiUsage(result.ai_usage);
        }
        setShowApiKey(false);
        setMessage({
          type: "success",
          text: result.message || "Settings saved successfully!",
        });
      } else {
        setMessage({
          type: "error",
          text: result.message || "Failed to save settings.",
        });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({
        type: "error",
        text: "An error occurred while saving settings.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestApiKey = async () => {
    setTestingKey(true);
    setTestResult(null);

    try {
      const response = await fetch(CONTENT_MOOD_ANALYZER?.apiUrl + "/ai/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-WP-Nonce": CONTENT_MOOD_ANALYZER?.nonce,
        },
        // Test whatever is currently typed/selected; if the key field is blank
        // (saved-key view), the backend falls back to the already-saved key.
        body: JSON.stringify({ api_key: settings.ai_api_key, model: settings.ai_model }),
      });
      const result = await response.json();

      setTestResult({
        success: !!result.success,
        message: result.message || (result.success ? "Success!" : "The test request failed."),
      });

      if (result.ai_usage) {
        setAiUsage(result.ai_usage);
      }
    } catch (error) {
      console.error("Error testing API key:", error);
      setTestResult({ success: false, message: "An error occurred while testing the API key." });
    } finally {
      setTestingKey(false);
    }
  };

  const handleRemoveApiKey = async () => {
    if (
      !window.confirm(
        "Remove the saved API key? You won't be able to generate AI keyword suggestions until you add a new one."
      )
    ) {
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch(CONTENT_MOOD_ANALYZER?.apiUrl + "/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-WP-Nonce": CONTENT_MOOD_ANALYZER?.nonce,
        },
        body: JSON.stringify({ ai_api_key_remove: true }),
      });
      const result = await response.json();

      if (result.success) {
        setSettings((prev) => ({ ...prev, ...result.settings, ai_api_key: "" }));
        setIsEditingApiKey(true);
        setMessage({ type: "success", text: "API key removed." });
      } else {
        setMessage({
          type: "error",
          text: result.message || "Failed to remove the API key.",
        });
      }
    } catch (error) {
      console.error("Error removing API key:", error);
      setMessage({
        type: "error",
        text: "An error occurred while removing the API key.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fills in all three keyword fields at once, each from its own prompt box,
  // triggered by the single shared "Generate" button.
  const handleGenerateAllKeywords = async () => {
    setGeneratingAll(true);
    setGenerateResult({ positive: null, negative: null, neutral: null });

    await Promise.all(
      KEYWORD_FIELDS.map(async (field) => {
        try {
          const response = await fetch(CONTENT_MOOD_ANALYZER?.apiUrl + "/ai/generate-keywords", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-WP-Nonce": CONTENT_MOOD_ANALYZER?.nonce,
            },
            body: JSON.stringify({ sentiment: field.key, prompt: keywordPrompts[field.key] }),
          });
          const result = await response.json();

          if (result.success) {
            setSettings((prev) => ({ ...prev, [field.settingKey]: result.keywords }));
            setGenerateResult((prev) => ({
              ...prev,
              [field.key]: { success: true, message: "Generated." },
            }));
          } else {
            setGenerateResult((prev) => ({
              ...prev,
              [field.key]: { success: false, message: result.message || "Failed to generate keywords." },
            }));
          }

          if (result.ai_usage) {
            setAiUsage(result.ai_usage);
          }
        } catch (error) {
          console.error("Error generating keywords:", error);
          setGenerateResult((prev) => ({
            ...prev,
            [field.key]: { success: false, message: "An error occurred while generating keywords." },
          }));
        }
      })
    );

    setGeneratingAll(false);
  };

  return (
    <div className="content-mood-analyzer-container max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Content Mood Analyzer Settings
      </h1>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {activeTab === "general" && (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">
                Keyword Settings
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                Enter keywords separated by commas — these are what sentiment
                analysis counts against every post. Or describe a category for
                each field below (e.g. "Customer & Product Reviews", "Financial &
                Economic Context", "Weather & Nature"), then click Generate once
                to have AI research and fill in all three keyword lists together.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {KEYWORD_FIELDS.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                    </label>
                    <textarea
                      name={field.settingKey}
                      value={settings[field.settingKey]}
                      onChange={handleInputChange}
                      placeholder={field.placeholder}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-32"
                    />

                    <input
                      type="text"
                      value={keywordPrompts[field.key]}
                      onChange={(e) =>
                        setKeywordPrompts((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      placeholder={field.promptPlaceholder}
                      className="mt-2 w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />

                    {generateResult[field.key] && (
                      <p
                        className={`text-xs mt-1 ${
                          generateResult[field.key].success ? "text-green-700" : "text-red-700"
                        }`}
                      >
                        {generateResult[field.key].success ? "✅ " : "❌ "}
                        {generateResult[field.key].message}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleGenerateAllKeywords}
                  disabled={generatingAll || !settings.ai_api_key_set}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {generatingAll ? "Generating…" : "✨ Generate Keywords"}
                </button>
                <p className="text-xs text-gray-500">
                  {settings.ai_api_key_set
                    ? "Fills in all three fields above from the category text you typed under each one. Uses up to 3 requests from your daily AI limit."
                    : "Add a Gemini API key in the AI Analysis tab to enable this."}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">
                Display Settings
              </h2>

              <div className="flex items-center">
                <label className="block text-sm font-medium text-gray-700 mr-3">
                  Badge Position
                </label>
                <select
                  name="badge_position"
                  value={settings.badge_position}
                  onChange={handleInputChange}
                  className="w-[100px] p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                  <option value="none">None</option>
                </select>
              </div>
            </div>
          </>
        )}

        {activeTab === "ai" && (
          <div className="mb-6 space-y-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-1">
                AI Keyword Research
              </h2>
              <p className="text-gray-600 text-sm">
                Configure the AI provider used by the "✨ Generate" buttons on the
                General tab to research keyword suggestions for your
                Positive/Negative/Neutral lists. AI is never used to analyze posts
                directly — sentiment analysis always counts your keyword lists.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Provider
              </label>
              <select
                name="ai_provider"
                value={settings.ai_provider}
                onChange={handleInputChange}
                className="w-full md:w-64 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="gemini">Google Gemini (free tier)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model
              </label>
              <select
                value={
                  MODEL_OPTIONS.some((m) => m.value === settings.ai_model)
                    ? settings.ai_model
                    : "custom"
                }
                onChange={(e) => {
                  const value = e.target.value;
                  setSettings((prev) => ({
                    ...prev,
                    ai_model: value === "custom" ? "" : value,
                  }));
                }}
                className="w-full md:w-64 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {MODEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
                <option value="custom">Custom model ID…</option>
              </select>
              {!MODEL_OPTIONS.some((m) => m.value === settings.ai_model) && (
                <input
                  type="text"
                  value={settings.ai_model}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, ai_model: e.target.value }))
                  }
                  placeholder="e.g. gemini-1.5-flash-8b"
                  className="mt-2 w-full md:w-64 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              )}
              <p className="text-xs text-gray-500 mt-1">
                If a key returns a quota error on one model, try another —
                free-tier quota is sometimes allocated per model rather than
                per key.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gemini API Key
              </label>

              {!isEditingApiKey && settings.ai_api_key_set ? (
                <div className="flex gap-2 max-w-lg">
                  <div className="flex-1 p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 font-mono text-sm">
                    •••• •••• •••• {settings.ai_api_key_last4}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSettings((prev) => ({ ...prev, ai_api_key: "" }));
                      setIsEditingApiKey(true);
                    }}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={handleTestApiKey}
                    disabled={testingKey}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {testingKey ? "Testing..." : "Test"}
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveApiKey}
                    disabled={loading}
                    className="px-3 py-2 text-sm border border-red-300 rounded-md text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 max-w-lg">
                  <input
                    type={showApiKey ? "text" : "password"}
                    name="ai_api_key"
                    value={settings.ai_api_key}
                    onChange={handleInputChange}
                    placeholder="Paste your Gemini API key"
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey((prev) => !prev)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50"
                  >
                    {showApiKey ? "Hide" : "Show"}
                  </button>
                  <button
                    type="button"
                    onClick={handleTestApiKey}
                    disabled={testingKey || !settings.ai_api_key}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {testingKey ? "Testing..." : "Test"}
                  </button>
                  {settings.ai_api_key_set && (
                    <button
                      type="button"
                      onClick={() => {
                        setSettings((prev) => ({ ...prev, ai_api_key: "" }));
                        setIsEditingApiKey(false);
                      }}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}

              {testResult && (
                <p
                  className={`text-xs mt-2 ${
                    testResult.success ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {testResult.success ? "✅ " : "❌ "}
                  {testResult.message}
                </p>
              )}

              <p className="text-xs text-gray-500 mt-1">
                Get a free key from{" "}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Google AI Studio
                </a>
                . Testing uses one request from your daily limit below.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Daily Request Limit
              </label>
              <input
                type="number"
                name="ai_daily_limit"
                min="1"
                max="100000"
                value={settings.ai_daily_limit}
                onChange={handleInputChange}
                className="w-32 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Once this many AI requests (testing + keyword generation) are used
                today, further requests are blocked until the count resets at
                midnight.
              </p>
            </div>

            {aiUsage && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between text-sm text-blue-800 mb-2">
                  <span>Today&apos;s AI usage</span>
                  <span>
                    {aiUsage.used} / {aiUsage.limit} requests
                  </span>
                </div>
                <div className="w-full bg-blue-100 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (aiUsage.used / Math.max(1, aiUsage.limit)) * 100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
            )}

            {aiUsage?.last_error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>⚠️ Last AI request failed:</strong> {aiUsage.last_error}
                </p>
              </div>
            )}
          </div>
        )}

        {message.text && (
          <div
            className={`p-4 rounded-md ${
              message.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>

      {/* Clear Cache Section */}
      <ClearCache />

      <div className="mt-8 pt-6 border-t border-gray-200">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">
          About Sentiment Analysis
        </h2>
        <p className="text-gray-600">
          This plugin analyzes the sentiment of your WordPress posts by counting
          the keywords you define. Posts are analyzed for positive, negative, or
          neutral sentiment based on the frequency of matches with your defined
          keyword lists. AI can optionally help research those keyword lists, but
          never analyzes posts directly.
        </p>
      </div>
    </div>
  );
};

export default Settings;
