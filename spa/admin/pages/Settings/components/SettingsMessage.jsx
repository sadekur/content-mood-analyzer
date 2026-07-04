import React from "react";

const SettingsMessage = ({ message }) => {
  if (!message?.text) {
    return null;
  }

  return (
    <div
      className={`p-4 rounded-md ${
        message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
      }`}
    >
      {message.text}
    </div>
  );
};

export default SettingsMessage;
