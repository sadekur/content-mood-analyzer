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
 * Post types sentiment analysis applies to. Always at least `post` - an
 * empty/invalid saved value falls back to it rather than silently analyzing
 * nothing.
 *
 * @return string[]
 */
function cma_get_enabled_post_types() {
    $types = cma_get_setting( 'enabled_post_types', array( 'post' ) );

    if ( ! is_array( $types ) || empty( $types ) ) {
        return array( 'post' );
    }

    return $types;
}

/**
 * Whether a given post type is enabled for sentiment analysis.
 */
function cma_is_post_type_enabled( $post_type ) {
    return in_array( $post_type, cma_get_enabled_post_types(), true );
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
 * Perform sentiment analysis on a post by counting keyword matches.
 *
 * The Positive/Negative/Neutral keyword lists can themselves be researched
 * and generated with AI (see cma_get_ai_provider() / the /ai/generate-keywords
 * REST route), but the actual per-post analysis is always this free,
 * instant keyword count - no AI call happens here.
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
    update_post_meta( $post->ID, '_post_sentiment_counts', array(
        'positive' => $positive_count,
        'negative' => $negative_count,
        'neutral'  => $neutral_count,
    ) );
    update_post_meta( $post->ID, '_post_sentiment_analyzed_at', current_time( 'mysql' ) );
    delete_transient( 'cma_posts_' . $sentiment );

    return $sentiment;
}

/**
 * Instantiate the configured AI keyword-research provider, or null if none
 * is usable (no key configured). Only Gemini is supported today; the
 * interface already allows more providers to be added without touching the
 * REST endpoint that calls this.
 */
function cma_get_ai_provider() {
    $api_key = cma_get_setting( 'ai_api_key', '' );

    if ( empty( $api_key ) ) {
        return null;
    }

    $provider = cma_get_setting( 'ai_provider', 'gemini' );
    $model    = cma_get_setting( 'ai_model', 'gemini-2.0-flash' );

    switch ( $provider ) {
        case 'gemini':
        default:
            return new \Content_Mood\Services\AI\Gemini_Provider( $api_key, $model );
    }
}

/**
 * Get today's AI usage counter, resetting it when the date has rolled over.
 *
 * @return array{date:string,count:int}
 */
function cma_ai_get_usage() {
    $today = current_time( 'Y-m-d' );
    $usage = get_option( 'content_mood_analyzer_ai_usage', array() );

    if ( empty( $usage['date'] ) || $usage['date'] !== $today ) {
        $usage = array(
            'date'  => $today,
            'count' => 0,
        );
        update_option( 'content_mood_analyzer_ai_usage', $usage );
    }

    return $usage;
}

/**
 * Whether today's AI request count has reached the configured daily limit.
 */
function cma_ai_limit_reached() {
    $limit = (int) cma_get_setting( 'ai_daily_limit', 100 );
    $usage = cma_ai_get_usage();

    return $usage['count'] >= $limit;
}

/**
 * Record one AI API request against today's usage counter.
 */
function cma_ai_record_usage() {
    $usage = cma_ai_get_usage();
    $usage['count']++;

    update_option( 'content_mood_analyzer_ai_usage', $usage );
}

/**
 * Usage summary for display in the admin Settings screen.
 *
 * @return array{used:int,limit:int,remaining:int,date:string,last_error:?string}
 */
function cma_ai_get_usage_status() {
    $usage = cma_ai_get_usage();
    $limit = (int) cma_get_setting( 'ai_daily_limit', 100 );
    $error = cma_ai_get_last_error();

    return array(
        'used'       => $usage['count'],
        'limit'      => $limit,
        'remaining'  => max( 0, $limit - $usage['count'] ),
        'date'       => $usage['date'],
        'last_error' => $error ? $error['message'] : null,
    );
}

/**
 * Record the most recent AI request failure, so it can be surfaced in the
 * admin UI instead of failing silently.
 */
function cma_ai_set_last_error( $message ) {
    update_option( 'content_mood_analyzer_ai_last_error', array(
        'message' => $message,
        'time'    => current_time( 'mysql' ),
    ) );
}

/**
 * Clear the last recorded AI failure - called whenever a request succeeds.
 */
function cma_ai_clear_last_error() {
    delete_option( 'content_mood_analyzer_ai_last_error' );
}

/**
 * @return array{message:string,time:string}|null
 */
function cma_ai_get_last_error() {
    $error = get_option( 'content_mood_analyzer_ai_last_error', null );

    return $error ?: null;
}

/**
 * Background bulk analysis.
 *
 * A single "Analyze all posts" click used to loop over every post inside one
 * HTTP request - fine for a handful of posts, but a guaranteed timeout/memory
 * exhaustion on a large site, with zero feedback while it ran. Instead this
 * queues all matching post IDs once, then processes them a small batch at a
 * time via WP-Cron, persisting progress in an option so the admin UI can poll
 * and show a live progress bar across page reloads.
 */

/**
 * Current bulk-analysis run state, defaulting to an empty/idle queue.
 *
 * @return array{status:string,total:int,processed:int,positive:int,negative:int,neutral:int,post_ids:int[],started_at:?string,finished_at:?string}
 */
function cma_get_bulk_queue() {
    return get_option( 'content_mood_analyzer_bulk_queue', array(
        'status'      => 'idle',
        'total'       => 0,
        'processed'   => 0,
        'positive'    => 0,
        'negative'    => 0,
        'neutral'     => 0,
        'post_ids'    => array(),
        'started_at'  => null,
        'finished_at' => null,
    ) );
}

function cma_save_bulk_queue( $queue ) {
    // autoload=false: this can hold thousands of post IDs while running,
    // no reason to load it on every request via the alloptions cache.
    update_option( 'content_mood_analyzer_bulk_queue', $queue, false );
}

/**
 * Posts processed per WP-Cron batch. Kept small so every batch finishes
 * comfortably within typical PHP execution time limits.
 */
function cma_bulk_batch_size() {
    return max( 1, (int) apply_filters( 'content_mood_analyzer_bulk_batch_size', 20 ) );
}

/**
 * Seconds to wait between batches. Spaced out a little rather than back to
 * back, since each batch is nudged via a real (if lightweight) HTTP request
 * to wp-cron.php - a large site shouldn't self-hammer its own server.
 */
function cma_bulk_batch_interval() {
    return max( 1, (int) apply_filters( 'content_mood_analyzer_bulk_batch_interval', 5 ) );
}

/**
 * Start a new background bulk-analysis run over every post of an enabled
 * type. Returns false without doing anything if a run is already in
 * progress, so a double-click (or two open tabs) can't start two overlapping
 * queues.
 */
function cma_start_bulk_queue() {
    $queue = cma_get_bulk_queue();

    if ( 'running' === $queue['status'] ) {
        return false;
    }

    $post_ids = get_posts( array(
        'post_type'      => cma_get_enabled_post_types(),
        'post_status'    => 'publish',
        'posts_per_page' => -1,
        'fields'         => 'ids',
    ) );

    cma_save_bulk_queue( array(
        'status'      => 'running',
        'total'       => count( $post_ids ),
        'processed'   => 0,
        'positive'    => 0,
        'negative'    => 0,
        'neutral'     => 0,
        'post_ids'    => $post_ids,
        'started_at'  => current_time( 'mysql' ),
        'finished_at' => null,
    ) );

    cma_schedule_next_bulk_batch();

    return true;
}

/**
 * Cancel an in-progress run. Posts already processed keep the sentiment they
 * were given; only the remaining queue is dropped.
 */
function cma_cancel_bulk_queue() {
    $queue = cma_get_bulk_queue();

    if ( 'running' !== $queue['status'] ) {
        return;
    }

    $queue['status']      = 'cancelled';
    $queue['finished_at'] = current_time( 'mysql' );
    $queue['post_ids']    = array();

    cma_save_bulk_queue( $queue );
}

/**
 * Schedule the next batch and nudge WP-Cron so it runs soon, rather than
 * waiting for the next organic site visit to notice the scheduled event.
 */
function cma_schedule_next_bulk_batch() {
    if ( ! wp_next_scheduled( 'cma_process_bulk_batch' ) ) {
        wp_schedule_single_event( time() + cma_bulk_batch_interval(), 'cma_process_bulk_batch' );
    }

    if ( function_exists( 'spawn_cron' ) ) {
        spawn_cron();
    }
}

/**
 * WP-Cron callback: analyze one batch of posts, then either schedule the
 * next batch or mark the run complete.
 */
function cma_process_bulk_batch() {
    $queue = cma_get_bulk_queue();

    if ( 'running' !== $queue['status'] || empty( $queue['post_ids'] ) ) {
        return;
    }

    $batch = array_splice( $queue['post_ids'], 0, cma_bulk_batch_size() );

    foreach ( $batch as $post_id ) {
        $post = get_post( $post_id );

        if ( ! $post ) {
            continue;
        }

        $sentiment = cma_perform_sentiment_analysis( $post );

        if ( isset( $queue[ $sentiment ] ) ) {
            $queue[ $sentiment ]++;
        }

        $queue['processed']++;
    }

    if ( empty( $queue['post_ids'] ) ) {
        $queue['status']      = 'complete';
        $queue['finished_at'] = current_time( 'mysql' );
        cma_save_bulk_queue( $queue );
        cma_clear_sentiment_cache();
        return;
    }

    cma_save_bulk_queue( $queue );
    cma_schedule_next_bulk_batch();
}
add_action( 'cma_process_bulk_batch', 'cma_process_bulk_batch' );