<?php
namespace Content_Mood\Controllers\Front;
use Content_Mood\Traits\Hook;

defined( 'ABSPATH' ) || exit;

class Front {
    use Hook;

    /**
     * Constructor to add all hooks.
     */
    public function __construct() {
        $this->action( 'save_post', array( $this, 'analyze_post_sentiment', 10, 3 ) );
        $this->filter( 'the_content', array( $this, 'add_sentiment_badge' ) );
    }

    /**
     * Analyze post sentiment (hooks into save_post)
     */
    public function analyze_post_sentiment( $post_id, $post, $update ) {
        // Skip auto-saves and revisions
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }

        if ( wp_is_post_revision( $post_id ) ) {
            return;
        }
        // @todo Add support for custom post types
        if ($post->post_type !== 'post') {
            return;
        }

        // Perform the analysis
        cma_perform_sentiment_analysis( $post );
    }

    /**
     * Add sentiment badge to content
     */
    public function add_sentiment_badge($content) {
        if (!is_singular('post')) {
            return $content;
        }

        global $post;
        $sentiment = get_post_meta($post->ID, '_post_sentiment', true);

        if (empty($sentiment)) {
            // Public page view - keyword fallback only. Never call the AI
            // provider here, or an anonymous visitor loading an unanalyzed
            // post would add API latency to the page and burn the daily quota.
            $sentiment = cma_perform_sentiment_analysis( $post, false );
        }

        $settings = get_option('content_mood_analyzer_settings', array());
        $position = isset($settings['badge_position']) ? $settings['badge_position'] : 'none';
        if ($position === 'none') {
            return $content;
        }
        $badge = cma_get_sentiment_badge_html($sentiment);
        if ($position === 'top') {
            return $badge . $content;
        } else {
            return $content . $badge;
        }
    }
}
