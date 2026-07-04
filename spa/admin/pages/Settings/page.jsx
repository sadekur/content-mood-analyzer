import React, { useEffect, useState } from "react";
import BulkAnalyzer from "./components/BulkAnalyzer";
import ClearCache from "./components/ClearCache";

const TABS = [
  { key: "general", label: "General" },
  { key: "ai", label: "AI Analysis" },
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
    enabled_post_types: ["post"],
  });
  const [aiUsage, setAiUsage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const [availablePostTypes, setAvailablePostTypes] = useState([]);

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
        setAvailablePostTypes(result.available_post_types || []);
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

  const handlePostTypeToggle = (postType) => {
    setSettings((prev) => {
      const current = prev.enabled_post_types || [];
      const next = current.includes(postType)
        ? current.filter((type) => type !== postType)
        : [...current, postType];
      return { ...prev, enabled_post_types: next };
    });
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
        if (result.ai_usage) {
          setAiUsage(result.ai_usage);
        }
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

  // Confirms the (hardcoded) Gemini key/model still work, without exposing
  // any key/model configuration to the user.
  const handleTestConnection = async () => {
    setTestingKey(true);
    setTestResult(null);

    try {
      const response = await fetch(CONTENT_MOOD_ANALYZER?.apiUrl + "/ai/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-WP-Nonce": CONTENT_MOOD_ANALYZER?.nonce,
        },
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
      console.error("Error testing AI connection:", error);
      setTestResult({ success: false, message: "An error occurred while testing the connection." });
    } finally {
      setTestingKey(false);
    }
  };

  // Fills in all three keyword fields at once, each from its own prompt box,
  // triggered by the single shared "Generate" button.
  const handleGenerateAllKeywords = async () => {
    setGeneratingAll(true);
    setGenerateResult({ positive: null, negative: null, neutral: null });

    await Promise.all(
      KEYWORD_FIELDS.map(async (field) => {
        const prompt = keywordPrompts[field.key].trim();

        if (!prompt) {
          setGenerateResult((prev) => ({
            ...prev,
            [field.key]: { success: false, message: "Enter a category description first." },
          }));
          return;
        }

        try {
          const response = await fetch(CONTENT_MOOD_ANALYZER?.apiUrl + "/ai/generate-keywords", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-WP-Nonce": CONTENT_MOOD_ANALYZER?.nonce,
            },
            body: JSON.stringify({
              sentiment: field.key,
              prompt,
            }),
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
                  disabled={generatingAll}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {generatingAll ? "Generating…" : "✨ Generate Keywords"}
                </button>
                <p className="text-xs text-gray-500">
                  Fills in a field above from the category text you typed under it.
                  Uses one request per field with text entered.
                </p>
              </div>
              {aiUsage && (
                <p className="text-xs text-gray-500 mt-1">
                  {aiUsage.remaining} of {aiUsage.limit} AI generations left today.
                </p>
              )}
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">
                Post Types
              </h2>
              <p className="text-gray-600 text-sm mb-3">
                Choose which content types get analyzed for sentiment. At least one is always
                enabled — if none are checked, Posts is used automatically.
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {availablePostTypes.map((type) => (
                  <label key={type.value} className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={(settings.enabled_post_types || []).includes(type.value)}
                      onChange={() => handlePostTypeToggle(type.value)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    {type.label}
                  </label>
                ))}
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

            {/* Bulk Actions Section */}
            <BulkAnalyzer />

            {/* Clear Cache Section */}
            <ClearCache />

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">
                About Sentiment Analysis
              </h2>
              <p className="text-gray-600">
                This plugin analyzes the sentiment of your WordPress posts by
                counting the keywords you define. Posts are analyzed for
                positive, negative, or neutral sentiment based on the frequency
                of matches with your defined keyword lists. AI can optionally
                help research those keyword lists, but never analyzes posts
                directly.
              </p>
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
                The "✨ Generate" buttons on the General tab use Google Gemini
                (2.5 Flash) to research keyword suggestions for your
                Positive/Negative/Neutral lists. AI is never used to analyze
                posts directly — sentiment analysis always counts your keyword
                lists.
              </p>
            </div>

            <div>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingKey}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                {testingKey ? "Testing..." : "Test AI Connection"}
              </button>

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
    </div>
  );
};

export default Settings;
