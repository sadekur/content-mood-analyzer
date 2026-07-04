import React from "react";

const KeywordSettings = ({
  fields,
  settings,
  onInputChange,
  keywordPrompts,
  onPromptChange,
  generateResult,
  generatingAll,
  onGenerateAll,
  aiUsage,
}) => (
  <div className="mb-6">
    <h2 className="text-lg font-semibold text-gray-700 mb-3">Keyword Settings</h2>
    <p className="text-gray-600 text-sm mb-4">
      Enter keywords separated by commas — these are what sentiment analysis counts against every
      post. Or describe a category for each field below (e.g. "Customer & Product Reviews",
      "Financial & Economic Context", "Weather & Nature"), then click Generate once to have AI
      research and fill in all three keyword lists together.
    </p>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {fields.map((field) => (
        <div key={field.key}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
          <textarea
            name={field.settingKey}
            value={settings[field.settingKey]}
            onChange={onInputChange}
            placeholder={field.placeholder}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-32"
          />

          <input
            type="text"
            value={keywordPrompts[field.key]}
            onChange={(e) => onPromptChange(field.key, e.target.value)}
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
        onClick={onGenerateAll}
        disabled={generatingAll}
        className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
      >
        {generatingAll ? "Generating…" : "✨ Generate Keywords"}
      </button>
      <p className="text-xs text-gray-500">
        Fills in a field above from the category text you typed under it. Uses one request per
        field with text entered.
      </p>
    </div>
    {aiUsage && (
      <p className="text-xs text-gray-500 mt-1">
        {aiUsage.remaining} of {aiUsage.limit} AI generations left today.
      </p>
    )}
  </div>
);

export default KeywordSettings;
