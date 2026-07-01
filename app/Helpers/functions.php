<?php
 /**
 * Clear sentiment cache
 */
function cma_clear_sentiment_cache() {
    global $wpdb;
    
    $wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_cma_posts_%' OR option_name LIKE '_transient_timeout_cma_posts_%'" );
}

/**
 * Convert keyword string to array
 */
function cma_get_keywords_array( $keywords_string ) {
    if ( empty( $keywords_string ) ) {
        return array();
    }
    
    $keywords = array_map( 'trim', explode( ',', $keywords_string ) );
    return array_filter( $keywords );
}

/**
 * Count keyword matches in content
 */
function cma_count_keyword_matches( $content, $keywords ) {
    $count = 0;
    
    foreach ( $keywords as $keyword ) {
        $keyword = strtolower( trim( $keyword ) );
        if ( ! empty( $keyword ) ) {
            $count += substr_count( $content, $keyword );
        }
    }
    
    return $count;
}

/**
 * Get sentiment badge HTML
 */
function cma_get_sentiment_badge_html( $sentiment ) {
    $labels = array(
        'positive' => __( 'Positive', 'content-mood-analyzer' ),
        'negative' => __( 'Negative', 'content-mood-analyzer' ),
        'neutral' => __( 'Neutral', 'content-mood-analyzer' )
    );
    
    $label = isset( $labels[$sentiment] ) ? $labels[$sentiment] : $labels['neutral'];
    
    return sprintf(
        '<div class="sentiment-badge sentiment-badge-%s"><span class="sentiment-icon"></span><span class="sentiment-label">%s</span></div>',
        esc_attr( $sentiment ),
        esc_html( $label )
    );
}

function cma_get_setting( $key, $default = '' ) {
        $settings = get_option( 'content_mood_analyzer_settings', array() );
        return isset( $settings[$key] ) ? $settings[$key] : $default;
}

/**
 * One-time migration of the settings option from its old name
 * (sentiment_analyzer_settings) to the current one (content_mood_analyzer_settings),
 * so sites that saved settings before the rename don't lose them.
 */
function cma_migrate_legacy_settings_option() {
    if ( false === get_option( 'content_mood_analyzer_settings', false ) ) {
        $legacy = get_option( 'sentiment_analyzer_settings', false );

        if ( false !== $legacy ) {
            update_option( 'content_mood_analyzer_settings', $legacy );
            delete_option( 'sentiment_analyzer_settings' );
        }
    }
}

/**
 * Perform sentiment analysis on a post
 */
function cma_perform_sentiment_analysis( $post ) {
    $content = strtolower( $post->post_content . ' ' . $post->post_title );

    $positive_keywords = cma_get_keywords_array( cma_get_setting( 'positive_keywords', '' ) );
    $negative_keywords = cma_get_keywords_array( cma_get_setting( 'negative_keywords', '' ) );
    $neutral_keywords  = cma_get_keywords_array( cma_get_setting( 'neutral_keywords', '' ) );

    $positive_count = cma_count_keyword_matches( $content, $positive_keywords );
    $negative_count = cma_count_keyword_matches( $content, $negative_keywords );
    $neutral_count  = cma_count_keyword_matches( $content, $neutral_keywords );

    $sentiment = 'neutral';

    if ( $positive_count > 0 || $negative_count > 0 || $neutral_count > 0 ) {
        $max = max( $positive_count, $negative_count, $neutral_count );
        if ( $positive_count === $max ) $sentiment = 'positive';
        elseif ( $negative_count === $max ) $sentiment = 'negative';
    }

    update_post_meta( $post->ID, '_post_sentiment', sanitize_text_field( $sentiment ) );
    delete_transient( 'cma_posts_' . $sentiment );

    return $sentiment;
}