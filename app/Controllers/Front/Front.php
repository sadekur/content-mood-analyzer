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
        $this->perform_analysis( $post );
    }

    /**
     * Perform sentiment analysis
     */
    private function perform_analysis( $post ) {
        $content = strtolower( $post->post_content . ' ' . $post->post_title );
        $settings = get_option( 'content_mood_analyzer_settings', array() );
        $defaults = array(
            'positive_keywords' => '',
            'negative_keywords' => '',
            'neutral_keywords'  => '',
            'badge_position'    => 'top',
        );
        $settings = wp_parse_args( $settings, $defaults );

        // Get keyword lists from settings
        $positive_keywords = cma_get_keywords_array( $settings['positive_keywords'] );
        $negative_keywords = cma_get_keywords_array( $settings['negative_keywords'] );
        $neutral_keywords  = cma_get_keywords_array( $settings['neutral_keywords'] );

        // Count keyword matches
        $positive_count = cma_count_keyword_matches( $content, $positive_keywords );
        $negative_count = cma_count_keyword_matches( $content, $negative_keywords );
        $neutral_count  = cma_count_keyword_matches( $content, $neutral_keywords );

        $sentiment = 'neutral'; // Default
        
        if ($positive_count > 0 || $negative_count > 0 || $neutral_count > 0) {
            $max_count = max($positive_count, $negative_count, $neutral_count);
            
            if ($positive_count === $max_count) {
                $sentiment = 'positive';
            } elseif ($negative_count === $max_count) {
                $sentiment = 'negative';
            }
        }

        // Store sentiment in post meta
        update_post_meta($post->ID, '_post_sentiment', sanitize_text_field($sentiment));

        // Store analysis metadata
        update_post_meta($post->ID, '_post_sentiment_counts', array(
            'positive' => $positive_count,
            'negative' => $negative_count,
            'neutral'  => $neutral_count,
        ));

        update_post_meta($post->ID, '_post_sentiment_analyzed_at', current_time('mysql'));

        // Clear relevant caches
        delete_transient('cma_posts_' . $sentiment);

        return $sentiment;
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
            $sentiment = $this->perform_analysis($post);
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
