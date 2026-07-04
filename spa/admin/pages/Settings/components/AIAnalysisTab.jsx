import React from "react";

const AIAnalysisTab = ({ testingKey, testResult, onTestConnection, aiUsage }) => (
  <div className="mb-6 space-y-6">
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h2 className="text-lg font-semibold text-gray-700 mb-1">AI Keyword Research</h2>
      <p className="text-gray-600 text-sm">
        The "✨ Generate" buttons on the General tab use Google Gemini (2.5 Flash) to research
        keyword suggestions for your Positive/Negative/Neutral lists. AI is never used to analyze
        posts directly — sentiment analysis always counts your keyword lists.
      </p>
    </div>

    <div>
      <button
        type="button"
        onClick={onTestConnection}
        disabled={testingKey}
        className="px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-50"
      >
        {testingKey ? "Testing..." : "Test AI Connection"}
      </button>

      {testResult && (
        <p
          className={`text-xs mt-2 ${testResult.success ? "text-green-700" : "text-red-700"}`}
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
              width: `${Math.min(100, (aiUsage.used / Math.max(1, aiUsage.limit)) * 100)}%`,
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
);

export default AIAnalysisTab;
