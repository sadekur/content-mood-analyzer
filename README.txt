=== Content Mood Analyzer ===
Contributors: sadekur
Tags: content, mood, analysis, sentiment, posts, wordpress
Requires at least: 6.1
Tested up to: 6.4
Stable tag: 1.0.0
Requires PHP: 7.4
License: GPL v2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A WordPress plugin to analyze the mood of your content as positive, negative, or neutral, with optional AI-assisted keyword research.

== Description ==

Content Mood Analyzer scores your published content as positive, negative, or neutral by counting your own keyword lists against the title and content. Sentiment analysis is always this free, instant keyword count - AI is never used to classify your content directly.

Optionally, AI (Google Gemini) can help you *research* those keyword lists: describe a category (e.g. "Customer & Product Reviews") and it generates a starting list of keywords for you to review and edit. This works out of the box with no setup and no API key of your own required - the plugin includes a shared, rate-limited AI helper, capped at a fair daily number of requests per site so it stays free for everyone.

Features:
- Analyze individual posts, or run a background bulk analysis across every existing post without timing out, even on large sites - with a live progress bar and the option to cancel a run in progress
- Choose which content types get analyzed (Posts, Pages, and other public post types), not just Posts
- Mood badges shown automatically on single posts and on archive/blog/category/search excerpts
- `[sentiment-filter]` shortcode to let visitors browse content by mood on the front end
- Fully customizable keyword lists for each mood, with optional AI-assisted research to help build them
- One-click cache clearing if sentiment counts look stale after editing keywords or posts directly
- REST API for reading sentiment data and integrating with other tools
- React-powered admin dashboard: an overview, a sentiment-distribution chart with a 30/90-day trend, a searchable/paginated post browser, and settings

== Installation ==

1. Upload the plugin files to the `/wp-content/plugins/content-mood-analyzer` directory, or install the plugin through the WordPress plugins screen directly.
2. Activate the plugin through the 'Plugins' screen in WordPress.
3. Go to Content Mood Analyzer -> Settings to enter your keyword lists (or describe a category and click "Generate Keywords" to have AI suggest a starting list), choose which content types to analyze, and run a bulk analysis to score your existing content.

== Frequently Asked Questions ==

= How does the analysis work? =

The plugin counts occurrences of your positive, negative, and neutral keywords in each post's title and content. Whichever list matches most often wins; ties favor positive, then negative, then neutral. This is always a plain keyword count - AI is never used to decide a post's sentiment.

= Can I customize the keywords? =

Yes, add or edit the comma-separated keyword list for each mood in Settings. Changes apply the next time a post is analyzed (saving a post, or running bulk analysis).

= Do I need my own AI API key to use the "Generate Keywords" button? =

No. AI keyword research works immediately after activation through a shared helper included with the plugin, so there's nothing to sign up for or configure. It's rate-limited to a fair number of requests per site per day to keep it free for everyone; the counter resets daily.

= Does AI ever decide whether my content is positive or negative? =

No. AI is only used, optionally, to help you fill in a keyword list faster. The actual sentiment score is always the keyword count described above.

= Which content types can be analyzed? =

By default, Posts. You can enable Pages and other public post types in Settings -> General.

= Will bulk analysis time out on a site with thousands of posts? =

No. Bulk analysis runs in the background in small batches and reports live progress, so it's safe to start and navigate away.

= How do I show sentiment on my site? =

Badges appear automatically on single posts and on excerpt/archive cards once a post has been analyzed. You can also add the `[sentiment-filter]` shortcode to any page to let visitors filter content by mood.

== Changelog ==

= 1.0.0 =
* Initial release
