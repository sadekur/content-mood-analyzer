import React, { useState } from "react";

const ClearCache = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const handleClearCache = async () => {
    setIsLoading(true);
    setStatus("Clearing sentiment cache on server...");
    setError("");

    try {
      const response = await fetch(
        CONTMOAN.apiUrl + "/cache/clear",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-WP-Nonce": CONTMOAN.nonce,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to clear cache.");
      }

      if (data.success === false) {
        throw new Error(data.message || "Cache clear returned an error.");
      }

      // Success message
      setStatus(data.message || "Cache cleared successfully!");
      
    } catch (err) {
      console.error("Cache clear error:", err);
      setError(err.message || "Something went wrong while clearing cache.");
      setStatus("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Clear Sentiment Cache
      </h3>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <p className="text-sm text-gray-600 mb-6">
          This will remove <strong>all generated sentiment cache</strong> for posts.
        </p>

        {/* Error box */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Status box */}
        {status && !error && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">{status}</p>
          </div>
        )}

        {/* Button */}
        <button
          type="button"
          onClick={handleClearCache}
          disabled={isLoading}
          className={`
            px-6 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50
            ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 active:scale-95 shadow-lg hover:shadow-xl"
            }
          `}
        >
          {isLoading ? (
            <>
              <span className="inline-block animate-spin w-5 h-5 mr-3 border-2 border-white border-t-transparent rounded-full" />
              Clearing Cache...
            </>
          ) : (
            "Clear Cache Now"
          )}
        </button>

        <p className="mt-4 text-xs text-gray-500">
          Removes only cached transient entries – safe to run anytime.
        </p>
      </div>
    </div>
  );
};

export default ClearCache;
