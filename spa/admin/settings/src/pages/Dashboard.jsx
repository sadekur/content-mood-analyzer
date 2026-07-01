import React, { useState, useEffect } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = () => {
    const [counts, setCounts] = useState({ all: 0, positive: 0, neutral: 0, negative: 0 });
    const [recentPosts, setRecentPosts] = useState([]);
    const [loading, setLoading] = useState(true);

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
