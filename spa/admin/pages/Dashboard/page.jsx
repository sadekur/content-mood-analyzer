import React, { useState, useEffect } from "react";
import {
    Chart as ChartJS,
    ArcElement,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";

ChartJS.register(ArcElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

const TREND_RANGES = [
    { value: 30, label: "30 days" },
    { value: 90, label: "90 days" },
];

const Dashboard = () => {
    const [counts, setCounts] = useState({ all: 0, positive: 0, neutral: 0, negative: 0 });
    const [recentPosts, setRecentPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [trendDays, setTrendDays] = useState(30);
    const [trend, setTrend] = useState(null);
    const [trendLoading, setTrendLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const response = await fetch(
                    `${CONTENT_MOOD_ANALYZER?.apiUrl}/posts?page=1&per_page=5`,
                    { headers: { "X-WP-Nonce": CONTENT_MOOD_ANALYZER?.nonce } }
                );
                const data = await response.json();

                if (data.success) {
                    setRecentPosts(data.posts || []);
                    if (data.sentiment_counts) {
                        setCounts(data.sentiment_counts);
                    }
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    useEffect(() => {
        const fetchTrend = async () => {
            setTrendLoading(true);
            try {
                const response = await fetch(
                    `${CONTENT_MOOD_ANALYZER?.apiUrl}/trend?days=${trendDays}`,
                    { headers: { "X-WP-Nonce": CONTENT_MOOD_ANALYZER?.nonce } }
                );
                const data = await response.json();

                if (data.success) {
                    setTrend(data.trend);
                }
            } catch (error) {
                console.error("Error fetching sentiment trend:", error);
            } finally {
                setTrendLoading(false);
            }
        };

        fetchTrend();
    }, [trendDays]);

    const getSentimentBadgeClass = (sentiment) => {
        const classes = {
            positive: "bg-green-100 text-green-800",
            neutral: "bg-yellow-100 text-yellow-800",
            negative: "bg-red-100 text-red-800",
        };
        return classes[sentiment] || "bg-gray-100 text-gray-800";
    };

    const chartData = {
        labels: ["Positive", "Neutral", "Negative"],
        datasets: [
            {
                data: [counts.positive || 0, counts.neutral || 0, counts.negative || 0],
                backgroundColor: ["#16a34a", "#ca8a04", "#dc2626"],
                borderWidth: 0,
            },
        ],
    };

    const hasAnalyzedPosts = (counts.all || 0) > 0;

    const trendHasData =
        trend && [...trend.positive, ...trend.negative, ...trend.neutral].some((n) => n > 0);

    const trendChartData = trend && {
        labels: trend.labels,
        datasets: [
            {
                label: "Positive",
                data: trend.positive,
                borderColor: "#16a34a",
                backgroundColor: "#16a34a",
                tension: 0.3,
            },
            {
                label: "Negative",
                data: trend.negative,
                borderColor: "#dc2626",
                backgroundColor: "#dc2626",
                tension: 0.3,
            },
            {
                label: "Neutral",
                data: trend.neutral,
                borderColor: "#ca8a04",
                backgroundColor: "#ca8a04",
                tension: 0.3,
            },
        ],
    };

    const trendChartOptions = {
        responsive: true,
        interaction: { mode: "index", intersect: false },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { precision: 0 },
            },
        },
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">Sentiment distribution across all analyzed posts.</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : hasAnalyzedPosts ? (
                    <div className="max-w-xs mx-auto">
                        <Doughnut data={chartData} />
                    </div>
                ) : (
                    <p className="text-center text-gray-600 py-12">
                        No posts have been analyzed yet. Run a bulk analysis from the Settings page to
                        populate this chart.
                    </p>
                )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Sentiment Trend</h2>
                    <div className="flex gap-2">
                        {TREND_RANGES.map((range) => (
                            <button
                                key={range.value}
                                type="button"
                                onClick={() => setTrendDays(range.value)}
                                className={`px-3 py-1 text-sm rounded-md border ${
                                    trendDays === range.value
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                                }`}
                            >
                                {range.label}
                            </button>
                        ))}
                    </div>
                </div>

                {trendLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : trendHasData ? (
                    <Line data={trendChartData} options={trendChartOptions} />
                ) : (
                    <p className="text-center text-gray-600 py-12">
                        No posts published in the last {trendDays} days have a sentiment yet.
                    </p>
                )}
            </div>

            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                    <h2 className="text-lg font-semibold text-gray-900">Recently Analyzed Posts</h2>
                </div>
                <div className="p-6">
                    {loading ? (
                        <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    ) : recentPosts.length > 0 ? (
                        <div className="space-y-3">
                            {recentPosts.map((post) => (
                                <div key={post.id} className="flex items-center justify-between border rounded-lg p-3">
                                    <div>
                                        <a href={post.permalink} target="_blank" rel="noopener noreferrer" className="font-medium text-gray-900 hover:text-blue-600">
                                            {post.title}
                                        </a>
                                        <div className="text-xs text-gray-500 mt-1">{post.date}</div>
                                    </div>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getSentimentBadgeClass(post.sentiment)}`}>
                                        {post.sentiment ? post.sentiment.charAt(0).toUpperCase() + post.sentiment.slice(1) : "—"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-600">No analyzed posts yet.</p>
                    )}
                </div>
                <div className="px-6 pb-6">
                    <a href="#/sentiments" className="text-sm text-blue-600 hover:underline">
                        View all sentiments &rarr;
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
