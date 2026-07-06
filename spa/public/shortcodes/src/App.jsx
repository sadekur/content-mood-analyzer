import React, { useState, useEffect } from 'react'

const App = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSentiment, setSelectedSentiment] = useState('positive');

  useEffect(() => {
    fetchSentimentPosts();
  }, [selectedSentiment]);

  const fetchSentimentPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${window.CONTMOAN?.apiUrl}/posts/${selectedSentiment}?per_page=5&page=1`
      );
      const result = await response.json();
      if (result.success) {
        setPosts(result.posts || []);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-mood-analyzer-public max-w-4xl mx-auto p-4 bg-gray-50 rounded shadow-sm">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Content Mood Analyzer Public Component</h2>
      
      <div className="mb-4">
        <label className="mr-3">Filter by sentiment:</label>
        <select 
          value={selectedSentiment}
          onChange={(e) => setSelectedSentiment(e.target.value)}
          className="p-2 border border-gray-300 rounded-md"
        >
          <option value="positive">Positive</option>
          <option value="negative">Negative</option>
          <option value="neutral">Neutral</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-600">Loading posts...</p>
      ) : (
        <div className="space-y-3">
          {posts.length > 0 ? (
            posts.map(post => (
              <div key={post.id} className="bg-white p-3 rounded shadow-sm">
                <h3 className="font-medium">
                  <a href={post.permalink} className="text-blue-600 hover:underline">
                    {post.title}
                  </a>
                </h3>
                <p className="text-sm text-gray-600 mt-1">{post.excerpt}</p>
                <div className="mt-2 text-xs text-gray-500">
                  {post.date} | {post.sentiment.charAt(0).toUpperCase() + post.sentiment.slice(1)}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-600">No {selectedSentiment} posts found.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default App
