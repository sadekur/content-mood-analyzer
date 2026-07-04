import React from "react";

const TabNav = ({ tabs, activeTab, onChange }) => (
  <div className="border-b border-gray-200 mb-6">
    <nav className="flex gap-6">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
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
);

export default TabNav;
