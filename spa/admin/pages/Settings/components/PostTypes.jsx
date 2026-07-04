import React from "react";

const PostTypes = ({ availablePostTypes, enabledPostTypes, onToggle }) => (
  <div className="mb-6">
    <h2 className="text-lg font-semibold text-gray-700 mb-3">Post Types</h2>
    <p className="text-gray-600 text-sm mb-3">
      Choose which content types get analyzed for sentiment. At least one is always enabled - if
      none are checked, Posts is used automatically.
    </p>
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      {availablePostTypes.map((type) => (
        <label key={type.value} className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={(enabledPostTypes || []).includes(type.value)}
            onChange={() => onToggle(type.value)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          {type.label}
        </label>
      ))}
    </div>
  </div>
);

export default PostTypes;
