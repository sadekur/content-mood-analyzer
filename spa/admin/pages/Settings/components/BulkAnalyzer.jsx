// src/components/BulkAnalyzer.jsx
import React, { useEffect, useRef, useState } from "react";

const POLL_INTERVAL_MS = 2000;

const fetchStatus = () =>
  fetch(CONTENT_MOOD_ANALYZER?.apiUrl + "/analyze/bulk/status", {
    headers: { "X-WP-Nonce": CONTENT_MOOD_ANALYZER?.nonce },
  }).then((res) => res.json());

const BulkAnalyzer = () => {
  const [queue, setQueue] = useState(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const pollRef = useRef(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startPolling = () => {
    if (pollRef.current) {
      return;
    }
    pollRef.current = setInterval(async () => {
      try {
        const data = await fetchStatus();
        if (data.success) {
          setQueue(data.queue);
          if (data.queue.status !== "running") {
            stopPolling();
          }
        }
      } catch (err) {
        console.error("Error polling bulk analysis status:", err);
      }
    }, POLL_INTERVAL_MS);
  };

  // On mount, check whether a run is already in progress (e.g. started
  // earlier, then the admin navigated away and came back) and resume
  // showing/polling it instead of showing the idle "Start" button.
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchStatus();
        if (data.success) {
          setQueue(data.queue);
          if (data.queue.status === "running") {
            startPolling();
          }
        }
      } catch (err) {
        console.error("Error checking bulk analysis status:", err);
      }
    })();

    return stopPolling;
  }, []);

  const startBulkAnalysis = async () => {
    setStarting(true);
    setError("");

    try {
      const response = await fetch(CONTENT_MOOD_ANALYZER?.apiUrl + "/analyze/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-WP-Nonce": CONTENT_MOOD_ANALYZER.nonce,
        },
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Could not start bulk analysis.");
      }

      setQueue(data.queue);
      startPolling();
    } catch (err) {
      console.error("Bulk analysis error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setStarting(false);
    }
  };

  const cancelBulkAnalysis = async () => {
    try {
      const response = await fetch(CONTENT_MOOD_ANALYZER?.apiUrl + "/analyze/bulk/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-WP-Nonce": CONTENT_MOOD_ANALYZER.nonce,
        },
      });
      const data = await response.json();
      if (data.success) {
        setQueue(data.queue);
        stopPolling();
      }
    } catch (err) {
      console.error("Error cancelling bulk analysis:", err);
    }
  };

  const isRunning = queue?.status === "running";
  const percent =
    isRunning && queue.total > 0 ? Math.round((queue.processed / queue.total) * 100) : 0;

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Bulk Sentiment Analysis
      </h3>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <p className="text-sm text-gray-600 mb-6">
          Run sentiment analysis on <strong>all published posts at once</strong> using your current
          keyword rules. Processes in the background in small batches, so it's safe even with
          thousands of posts.
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Progress */}
        {isRunning && (
          <div className="mb-6 p-5 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex justify-between text-sm text-blue-800 mb-2">
              <span>Analyzing posts…</span>
              <span>
                {queue.processed} / {queue.total} ({percent}%)
              </span>
            </div>
            <div className="w-full bg-blue-100 rounded-full h-2 mb-4">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${percent}%` }}
              ></div>
            </div>
            <button
              type="button"
              onClick={cancelBulkAnalysis}
              className="px-4 py-2 text-sm border border-red-300 rounded-md text-red-600 hover:bg-red-50"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Results Summary */}
        {queue && (queue.status === "complete" || queue.status === "cancelled") && (
          <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-4">
              {queue.status === "complete" ? "Analysis Complete!" : "Analysis Cancelled"}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-3xl font-bold text-green-600">{queue.positive || 0}</div>
                <div className="text-sm text-gray-600 mt-1">Positive Posts</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-3xl font-bold text-red-600">{queue.negative || 0}</div>
                <div className="text-sm text-gray-600 mt-1">Negative Posts</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-3xl font-bold text-gray-500">{queue.neutral || 0}</div>
                <div className="text-sm text-gray-600 mt-1">Neutral Posts</div>
              </div>
            </div>
            <p className="text-center text-sm text-gray-600 mt-4">
              {queue.status === "complete" ? "Analyzed" : "Stopped after"}{" "}
              <strong>{queue.processed}</strong> of <strong>{queue.total}</strong> posts
            </p>
          </div>
        )}

        {/* Button */}
        {!isRunning && (
          <button
            type="button"
            onClick={startBulkAnalysis}
            disabled={starting}
            className={`
                px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50
                ${starting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 shadow-lg hover:shadow-xl"
                }
            `}
          >
            {starting ? (
              <>
                <span className="inline-block animate-spin w-5 h-5 mr-3 border-2 border-white border-t-transparent rounded-full" />
                Starting…
              </>
            ) : queue && (queue.status === "complete" || queue.status === "cancelled") ? (
              "Bulk Analyzer"
            ) : (
              "Start Bulk Analysis Now"
            )}
          </button>
        )}

        <p className="mt-4 text-xs text-gray-500">
          Runs in the background — you can navigate away and come back, progress is saved.
        </p>
      </div>
    </div>
  );
};

export default BulkAnalyzer;
