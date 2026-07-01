import React, { useEffect, useState } from "react";
import BulkAnalyzer from "./components/BulkAnalyzer";
import ClearCache from "./components/ClearCache";

const TABS = [
  { key: "general", label: "General" },
  { key: "ai", label: "AI Analysis" },
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState({
    positive_keywords: "",
    negative_keywords: "",
    neutral_keywords: "",
    badge_position: "top",
    ai_enabled: false,
    ai_provider: "gemini",
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

  const handleRemoveApiKey = async () => {
    if (
      !window.confirm(
        "Remove the saved API key? AI analysis will fall back to keywords until you add a new one."
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
                Enter keywords separated by commas. These are always used when AI
                analysis (in the AI Analysis tab) is disabled, and automatically as
                a fallback whenever AI is unavailable — no key set, daily limit
                reached, or a request fails.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Positive Keywords
                  </label>
                  <textarea
                    name="positive_keywords"
                    value={settings.positive_keywords}
                    onChange={handleInputChange}
                    placeholder="e.g., good, great, excellent, wonderful"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-32"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Negative Keywords
                  </label>
                  <textarea
                    name="negative_keywords"
                    value={settings.negative_keywords}
                    onChange={handleInputChange}
                    placeholder="e.g., bad, terrible, awful, poor"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-32"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Neutral Keywords
                  </label>
                  <textarea
                    name="neutral_keywords"
                    value={settings.neutral_keywords}
                    onChange={handleInputChange}
                    placeholder="e.g., okay, fine, average, normal"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-32"
                  />
                </div>
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
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-gray-700">
                  AI-Powered Analysis
                </h2>
                <button
                  type="button"
                  role="switch"
                  aria-checked={!!settings.ai_enabled}
                  onClick={() =>
                    setSettings((prev) => ({ ...prev, ai_enabled: !prev.ai_enabled }))
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    settings.ai_enabled ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                      settings.ai_enabled ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
              <p className="text-gray-600 text-sm mt-2">
                Use a free AI model to classify sentiment instead of counting
                keywords. Falls back to keyword analysis automatically once the
                daily request limit below is reached, so posts always get a
                sentiment.
              </p>
            </div>

            {settings.ai_enabled && (
              <>
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
                    .
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
                    Once this many AI requests are used today, new posts fall back
                    to free keyword analysis until the count resets at midnight.
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

                <p className="text-xs text-gray-500">
                  To confirm AI analysis is actually running: save a key here, then
                  edit and update a post (or run Bulk Analysis below). Check the
                  usage counter above — it increments on every AI request — and
                  look for the "AI" tag next to posts in the All Sentiments and
                  Dashboard pages (posts analyzed by keywords are tagged "Keyword").
                </p>
              </>
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

      {/* Bulk Actions Section */}
      <BulkAnalyzer />

      {/* Clear Cache Section */}
      <ClearCache />

      <div className="mt-8 pt-6 border-t border-gray-200">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">
          About Sentiment Analysis
        </h2>
        <p className="text-gray-600">
          This plugin analyzes the sentiment of your WordPress posts based on
          the keywords you define, or optionally a free AI model. Posts are
          analyzed for positive, negative, or neutral sentiment.
        </p>
      </div>
    </div>
  );
};

export default Settings;
