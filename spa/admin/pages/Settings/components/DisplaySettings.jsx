import React from "react";

const DisplaySettings = ({ badgePosition, onChange }) => (
  <div className="mb-6">
    <h2 className="text-lg font-semibold text-gray-700 mb-3">Display Settings</h2>

    <div className="flex items-center">
      <label className="block text-sm font-medium text-gray-700 mr-3">Badge Position</label>
      <select
        name="badge_position"
        value={badgePosition}
        onChange={onChange}
        className="w-[100px] p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="top">Top</option>
        <option value="bottom">Bottom</option>
        <option value="none">None</option>
      </select>
    </div>
  </div>
);

export default DisplaySettings;
