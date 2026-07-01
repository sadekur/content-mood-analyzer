import React, { useEffect, useState } from "react";
import BulkAnalyzer from "./components/BulkAnalyzer";
import ClearCache from "./components/ClearCache";

const Sentiments = () => {
  const [settings, setSettings] = useState({
    positive_keywords: "",
    negative_keywords: "",
    neutral_keywords: "",
    badge_position: "top",
  });
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
        setSettings(result.settings);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
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

  return (
    <div className="content-mood-analyzer-container max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Content Mood Analyzer Settings
      </h1>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">
            Keyword Settings
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Enter keywords separated by commas. These will be used to determine
            sentiment of your content.
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
          the keywords you define. Posts are analyzed for positive, negative, or
          neutral sentiment based on the frequency of matches with your defined
          keyword lists.
        </p>
      </div>
    </div>
  );
};

export default Sentiments;
