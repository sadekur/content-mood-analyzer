import React, { useState, useEffect } from "react";
import Pagination from "../../../../common/Pagination";

const Sentiments = ({ page }) => {
    const [activeTab, setActiveTab] = useState("all");
    const [counts, setCounts] = useState({
        all: 0,
        positive: 0,
        neutral: 0,
        negative: 0,
    });
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(1);
    const postPerPage = 10;

    // Fetch posts based on active tab and page
    const fetchPosts = async (sentiment, currentPage) => {
        setLoading(true);
        try {
            let url = `${CONTENT_MOOD_ANALYZER?.apiUrl}/posts?page=${currentPage}&per_page=${postPerPage}`;

            if (sentiment !== 'all') {
                url += `&sentiment=${sentiment}`;
            }

            const response = await fetch(url, {
                headers: {
                    "X-WP-Nonce": CONTENT_MOOD_ANALYZER?.nonce,
                },
            });

            const data = await response.json();

            if (data.success) {
                setPosts(data.posts || []);
                setTotalPages(data.total_pages || 1);

                if (data.sentiment_counts) {
                    setCounts(data.sentiment_counts);
                }
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
            setPosts([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch when activeTab or page changes
    useEffect(() => {
        fetchPosts(activeTab, page);
    }, [activeTab, page]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        // Reset to page 1 when changing tabs
        window.location.hash = `#/sentiments`;
    };

    const getSentimentBadgeClass = (sentiment) => {
        const classes = {
            positive: 'bg-green-100 text-green-800',
            neutral: 'bg-yellow-100 text-yellow-800',
            negative: 'bg-red-100 text-red-800',
        };
        return classes[sentiment] || 'bg-gray-100 text-gray-800';
    };

    const tabs = [
        { key: 'all', label: 'All', count: counts.all },
        { key: 'positive', label: 'Positive', count: counts.positive },
        { key: 'neutral', label: 'Neutral', count: counts.neutral },
        { key: 'negative', label: 'Negative', count: counts.negative },
    ];

    return (
        <div className="bg-white rounded-lg shadow">
            {/* Header */}
            <div className="p-6 border-b">
                <h1 className="text-2xl font-bold text-gray-900">
                    All Sentiments
                </h1>
                <p className="text-gray-600 mt-1">
                    View and manage all posts with sentiment analysis.
                </p>
            </div>

            {/* Tabs */}
            <div className="border-b">
                <nav className="flex -mb-px px-6">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => handleTabChange(tab.key)}
                            className={`
                                py-4 px-6 text-sm font-medium border-b-2 transition-colors
                                ${activeTab === tab.key
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }
                            `}
                        >
                            {tab.label}
                            <span className={`
                                ml-2 py-0.5 px-2 rounded-full text-xs
                                ${activeTab === tab.key
                                    ? 'bg-blue-100 text-blue-600'
                                    : 'bg-gray-100 text-gray-600'
                                }
                            `}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content */}
            <div className="p-6">
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : posts.length > 0 ? (
                    <>
                        <div className="space-y-4">
                            {posts.map((post) => (
                                <div
                                    key={post.id}
                                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {post.title}
                                                </h3>
                                                <span className={`
                                                    px-2.5 py-0.5 rounded-full text-xs font-medium
                                                    ${getSentimentBadgeClass(post.sentiment)}
                                                `}>
                                                    {post.sentiment.charAt(0).toUpperCase() + post.sentiment.slice(1)}
                                                </span>
                                            </div>
                                            <p className="text-gray-600 text-sm mb-3">
                                                {post.excerpt}
                                            </p>
                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                    {post.post_type_label || post.post_type}
                                                </span>
                                                <span>📅 {post.date}</span>
                                                <span>✍️ {post.author}</span>
                                                <span>ID: {post.id}</span>
                                            </div>
                                        </div>

                                        <a
                                            href={post.permalink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="ml-4 px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                                        >
                                            View Post
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <Pagination
                                baseSlug="sentiments"
                                current={page}
                                total={totalPages}
                            />
                        )}
                    </>
                ) : (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📭</div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            No posts found
                        </h3>
                        <p className="text-gray-600">
                            There are no {activeTab !== 'all' ? activeTab : ''} sentiment posts yet.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sentiments;
