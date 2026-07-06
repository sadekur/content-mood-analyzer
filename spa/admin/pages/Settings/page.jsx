import React, { useEffect, useState } from "react";
import { TABS, KEYWORD_FIELDS } from "./constants";
import TabNav from "./components/TabNav";
import KeywordSettings from "./components/KeywordSettings";
import PostTypes from "./components/PostTypes";
import DisplaySettings from "./components/DisplaySettings";
import AboutSentimentAnalysis from "./components/AboutSentimentAnalysis";
import AIAnalysisTab from "./components/AIAnalysisTab";
import SettingsMessage from "./components/SettingsMessage";
import BulkAnalyzer from "./components/BulkAnalyzer";
import ClearCache from "./components/ClearCache";

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
      const response = await fetch(CONTMOAN?.apiUrl + "/settings", {
        headers: {
          "X-WP-Nonce": CONTMOAN?.nonce,
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

  const handlePromptChange = (key, value) => {
    setKeywordPrompts((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch(CONTMOAN?.apiUrl + "/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-WP-Nonce": CONTMOAN?.nonce,
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
      const response = await fetch(CONTMOAN?.apiUrl + "/ai/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-WP-Nonce": CONTMOAN?.nonce,
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
          const response = await fetch(CONTMOAN?.apiUrl + "/ai/generate-keywords", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-WP-Nonce": CONTMOAN?.nonce,
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
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Content Mood Analyzer Settings</h1>

      <TabNav tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      <form onSubmit={handleSave} className="space-y-6">
        {activeTab === "general" && (
          <>
            <KeywordSettings
              fields={KEYWORD_FIELDS}
              settings={settings}
              onInputChange={handleInputChange}
              keywordPrompts={keywordPrompts}
              onPromptChange={handlePromptChange}
              generateResult={generateResult}
              generatingAll={generatingAll}
              onGenerateAll={handleGenerateAllKeywords}
              aiUsage={aiUsage}
            />

            <PostTypes
              availablePostTypes={availablePostTypes}
              enabledPostTypes={settings.enabled_post_types}
              onToggle={handlePostTypeToggle}
            />

            <DisplaySettings badgePosition={settings.badge_position} onChange={handleInputChange} />

            {/* Bulk Actions Section */}
            <BulkAnalyzer />

            {/* Clear Cache Section */}
            <ClearCache />

            <AboutSentimentAnalysis />
          </>
        )}

        {activeTab === "ai" && (
          <AIAnalysisTab
            testingKey={testingKey}
            testResult={testResult}
            onTestConnection={handleTestConnection}
            aiUsage={aiUsage}
          />
        )}

        <SettingsMessage message={message} />

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
