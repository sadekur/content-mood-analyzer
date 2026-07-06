<?php
namespace Content_Mood\Controllers\Common;

use Content_Mood\Controllers\Front\Front;

defined('ABSPATH') || exit;

class Ajax {

    public function __construct() {
        add_action('wp_ajax_contmoan_bulk_update_sentiment', [$this, 'bulk_update_sentiment_ajax']);
    }

    public function bulk_update_sentiment_ajax() {
        check_ajax_referer('contmoan_bulk_update_sentiment_action', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(__('Permission denied', 'content-mood-analyzer'));
        }

        $collect_frontend = new Front();

        $posts = get_posts([
            'post_type'      => 'post',
            'post_status'    => 'publish',
            'posts_per_page' => -1,
        ]);

        foreach ($posts as $post) {
            $collect_frontend->analyze_post_sentiment($post->ID, $post, true);
        }

        wp_send_json_success(__('Bulk update completed', 'content-mood-analyzer'));
    }
}
