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
        $this->filter( 'the_excerpt', array( $this, 'add_sentiment_badge_to_excerpt' ) );
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

        if ( ! cma_is_post_type_enabled( $post->post_type ) ) {
            return;
        }

        // Perform the analysis
        cma_perform_sentiment_analysis( $post );
    }

    /**
     * Add sentiment badge to content on singular post views
     */
    public function add_sentiment_badge($content) {
        if (!is_singular('post')) {
            return $content;
        }

        global $post;
        return $this->apply_badge($post, $content);
    }

    /**
     * Add sentiment badge to excerpts on archive/listing pages (blog index,
     * category, tag, search, author archives). the_content only fires on
     * singular post views, so listing cards need their own hook.
     */
    public function add_sentiment_badge_to_excerpt($excerpt) {
        if (is_singular('post') || get_post_type() !== 'post') {
            return $excerpt;
        }

        global $post;
        return $this->apply_badge($post, $excerpt);
    }

    /**
     * Prepend/append the sentiment badge to some post output according to
     * the configured badge position, analyzing the post first if needed.
     */
    private function apply_badge($post, $output) {
        $settings = get_option('content_mood_analyzer_settings', array());
        $position = isset($settings['badge_position']) ? $settings['badge_position'] : 'none';

        if ($position === 'none') {
            return $output;
        }

        $sentiment = get_post_meta($post->ID, '_post_sentiment', true);

        if (empty($sentiment)) {
            $sentiment = cma_perform_sentiment_analysis($post);
        }

        $badge = cma_get_sentiment_badge_html($sentiment);

        return $position === 'top' ? $badge . $output : $output . $badge;
    }
}
