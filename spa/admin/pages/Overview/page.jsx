import React, { useState, useEffect } from "react";

const CARDS = [
    { key: "all", label: "All Posts", classes: "bg-gray-100 text-gray-800" },
    { key: "positive", label: "Positive", classes: "bg-green-100 text-green-800" },
    { key: "neutral", label: "Neutral", classes: "bg-yellow-100 text-yellow-800" },
    { key: "negative", label: "Negative", classes: "bg-red-100 text-red-800" },
];

const QUICK_LINKS = [
    { hash: "#/dashboard", label: "Open Dashboard", description: "Visual breakdown of sentiment across your posts." },
    { hash: "#/sentiments", label: "Browse All Sentiments", description: "Filter and review every analyzed post." },
    { hash: "#/settings", label: "Configure Settings", description: "Manage keywords, badge display, and cache." },
];

const Overview = () => {
    const [counts, setCounts] = useState({ all: 0, positive: 0, neutral: 0, negative: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCounts = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${CONTMOAN?.apiUrl}/posts?per_page=1`, {
                    headers: { "X-WP-Nonce": CONTMOAN?.nonce },
                });
                const data = await response.json();
                if (data.success && data.sentiment_counts) {
                    setCounts(data.sentiment_counts);
                }
            } catch (error) {
                console.error("Error fetching sentiment counts:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCounts();
    }, []);

    return (
        <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Content Mood Analyzer</h1>
                <p className="text-gray-600">
                    Analyzes the mood of your posts as positive, negative, or neutral based on the
                    keyword lists you define, and displays a mood badge on the post content.
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {CARDS.map((card) => (
                    <div key={card.key} className="bg-white rounded-lg shadow p-5 text-center">
                        <div className={`inline-flex items-center justify-center w-full py-1 rounded-full text-xs font-medium mb-3 ${card.classes}`}>
                            {card.label}
                        </div>
                        <div className="text-3xl font-bold text-gray-900">
                            {loading ? "—" : counts[card.key] ?? 0}
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {QUICK_LINKS.map((link) => (
                    <a
                        key={link.hash}
                        href={link.hash}
                        className="block bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow"
                    >
                        <div className="font-semibold text-blue-600 mb-1">{link.label}</div>
                        <p className="text-sm text-gray-600">{link.description}</p>
                    </a>
                ))}
            </div>
        </div>
    );
};

export default Overview;
