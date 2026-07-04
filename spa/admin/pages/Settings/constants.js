export const TABS = [
  { key: "general", label: "General" },
  { key: "ai", label: "AI Analysis" },
];

export const KEYWORD_FIELDS = [
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
