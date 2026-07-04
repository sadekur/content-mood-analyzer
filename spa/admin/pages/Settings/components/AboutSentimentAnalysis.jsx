import React from "react";

const AboutSentimentAnalysis = () => (
  <div className="mt-8 pt-6 border-t border-gray-200">
    <h2 className="text-lg font-semibold text-gray-700 mb-3">About Sentiment Analysis</h2>
    <p className="text-gray-600">
      This plugin analyzes the sentiment of your WordPress posts by counting the keywords you
      define. Posts are analyzed for positive, negative, or neutral sentiment based on the
      frequency of matches with your defined keyword lists. AI can optionally help research those
      keyword lists, but never analyzes posts directly.
    </p>
  </div>
);

export default AboutSentimentAnalysis;
