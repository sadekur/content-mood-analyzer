<?php
namespace Content_Mood\API;

defined( 'ABSPATH' ) || exit;

use Content_Mood\Traits\Rest;
use Content_Mood\Models\Content_Mood_Model as Content_Mood_Data_Model;

class Content_Mood_Data {

	use Rest;
 	/**
     * Analyze a single post
     */

	private $option_name = 'content_mood_analyzer_settings';


    /**
     * Update plugin settings
     */
    public function update_settings( $request ) {
        $current = get_option( $this->option_name, array() );

        $defaults = array(
            'positive_keywords'  => '',
            'negative_keywords'  => '',
            'neutral_keywords'   => '',
            'badge_position'     => 'top',
            'enabled_post_types' => array( 'post' ),
        );

        $current = wp_parse_args( $current, $defaults );

        $updated_fields = array();

        // Update only sent fields
        if ( $request->has_param('positive_keywords' ) ) {
            $current['positive_keywords'] = $request->get_param( 'positive_keywords' );
            $updated_fields[] = 'positive_keywords';
        }

        if ( $request->has_param( 'negative_keywords' ) ) {
            $current['negative_keywords'] = $request->get_param( 'negative_keywords' );
            $updated_fields[] = 'negative_keywords';
        }

        if ( $request->has_param( 'neutral_keywords' ) ) {
            $current['neutral_keywords'] = $request->get_param( 'neutral_keywords' );
            $updated_fields[] = 'neutral_keywords';
        }

        if ( $request->has_param( 'badge_position' ) ) {
            $current['badge_position'] = $request->get_param( 'badge_position' );
            $updated_fields[] = 'badge_position';
        }

        if ( $request->has_param( 'enabled_post_types' ) ) {
            $current['enabled_post_types'] = (array) $request->get_param( 'enabled_post_types' );
            $updated_fields[] = 'enabled_post_types';
        }

        // Save as single array
        $saved = update_option( $this->option_name, $current );

        if ( $saved ) {
            if ( in_array( 'positive_keywords', $updated_fields ) ||
                in_array( 'negative_keywords', $updated_fields ) ||
                in_array( 'neutral_keywords', $updated_fields ) ||
                in_array( 'enabled_post_types', $updated_fields ) ) {
                cma_clear_sentiment_cache();
            }

            // Provider/model/key are hardcoded now (see cma_get_ai_provider()) -
            // never echo back whatever may be left in the option from before
            // this was locked down.
            $response_settings = $current;
            unset( $response_settings['ai_provider'], $response_settings['ai_model'], $response_settings['ai_api_key'] );

            return rest_ensure_response( array(
                'success' => true,
                'updated' => $updated_fields,
                'settings' => $response_settings,
                'ai_usage' => cma_ai_get_usage_status(),
                'message' => __( 'Settings saved successfully.', 'content-mood-analyzer' ),
            ) );
        }

        return new \WP_Error(
            'save_failed',
            __( 'Failed to save settings.', 'content-mood-analyzer' ),
            array( 'status' => 500 )
        );
    }

    public function analyze_post( $request ) {
        $post_id 	= $request->get_param( 'id' );
        $post 		= get_post( $post_id );

        if ( ! $post ) {
            return new \WP_Error(
                'post_not_found',
                __( 'Post not found.', 'content-mood-analyzer' ),
                array( 'status' => 404 )
            );
        }

        if ( ! cma_is_post_type_enabled( $post->post_type ) ) {
            return new \WP_Error(
                'invalid_post_type',
                __( 'This post type is not enabled for sentiment analysis.', 'content-mood-analyzer' ),
                array( 'status' => 400 )
            );
        }

        // Analyze sentiment
        $sentiment = cma_perform_sentiment_analysis( $post );

        return rest_ensure_response( array(
            'success' => true,
            'post_id' => $post_id,
            'sentiment' => $sentiment,
            'message' => __( 'Post analyzed successfully.', 'content-mood-analyzer' ),
        ) );
    }

    /**
     * Start a background bulk-analysis run over every post of an enabled
     * type. Returns immediately - the actual analysis happens in small
     * WP-Cron batches (see cma_process_bulk_batch()), so this never risks
     * timing out on a large site. Poll /analyze/bulk/status for progress.
     */
    public function bulk_analyze( $request ) {
        if ( ! cma_start_bulk_queue() ) {
            return rest_ensure_response( array(
                'success' => false,
                'message' => __( 'A bulk analysis is already running.', 'content-mood-analyzer' ),
                'queue'   => $this->format_bulk_queue( cma_get_bulk_queue() ),
            ) );
        }

        return rest_ensure_response( array(
            'success' => true,
            'message' => __( 'Bulk analysis started in the background.', 'content-mood-analyzer' ),
            'queue'   => $this->format_bulk_queue( cma_get_bulk_queue() ),
        ) );
    }

    /**
     * Current progress of the background bulk-analysis run, for the
     * Settings screen to poll and show a live progress bar.
     */
    public function get_bulk_status( $request ) {
        return rest_ensure_response( array(
            'success' => true,
            'queue'   => $this->format_bulk_queue( cma_get_bulk_queue() ),
        ) );
    }

    /**
     * Cancel an in-progress bulk-analysis run. Posts already analyzed keep
     * their sentiment.
     */
    public function cancel_bulk_analysis( $request ) {
        cma_cancel_bulk_queue();

        return rest_ensure_response( array(
            'success' => true,
            'message' => __( 'Bulk analysis cancelled.', 'content-mood-analyzer' ),
            'queue'   => $this->format_bulk_queue( cma_get_bulk_queue() ),
        ) );
    }

    /**
     * Trim the queue down to what the frontend actually needs - never send
     * the full post ID list, it's an internal implementation detail and can
     * be large on a big site.
     */
    private function format_bulk_queue( $queue ) {
        return array(
            'status'      => $queue['status'],
            'total'       => $queue['total'],
            'processed'   => $queue['processed'],
            'positive'    => $queue['positive'],
            'negative'    => $queue['negative'],
            'neutral'     => $queue['neutral'],
            'started_at'  => $queue['started_at'],
            'finished_at' => $queue['finished_at'],
        );
    }

    /**
     * Clear all sentiment caches
     */
    public function clear_cache( $request ) {
        cma_clear_sentiment_cache();

        return rest_ensure_response( array(
            'success' => true,
            'message' => __( 'Cache cleared successfully.', 'content-mood-analyzer' ),
        ) );
    }

    /**
     * Daily positive/negative/neutral counts for the last 30 or 90 days, for
     * the Dashboard trend chart.
     */
    public function get_trend( $request ) {
        $days = (int) $request->get_param( 'days' );

        if ( ! in_array( $days, array( 30, 90 ), true ) ) {
            $days = 30;
        }

        return rest_ensure_response( array(
            'success' => true,
            'days'    => $days,
            'trend'   => Content_Mood_Data_Model::get_sentiment_trend( $days ),
        ) );
    }

    /**
     * Test the (hardcoded) Gemini key/model with one real keyword-research
     * request, so a bad key or an unavailable model is caught immediately
     * instead of discovered while trying to generate real keyword
     * suggestions.
     */
    public function test_ai_connection( $request ) {
        $provider = cma_get_ai_provider();
        $keywords = $provider->generate_keywords( 'positive', 'general test' );

        if ( null === $keywords ) {
            $error = cma_ai_get_last_error();

            return rest_ensure_response( array(
                'success'  => false,
                'message'  => $error ? $error['message'] : __( 'The AI request failed for an unknown reason.', 'content-mood-analyzer' ),
                'ai_usage' => cma_ai_get_usage_status(),
            ) );
        }

        return rest_ensure_response( array(
            'success'  => true,
            'message'  => sprintf(
                /* translators: %s: example keywords Gemini returned for the test prompt */
                __( 'Success! Gemini returned keywords like: %s.', 'content-mood-analyzer' ),
                implode( ', ', array_slice( $keywords, 0, 5 ) )
            ),
            'ai_usage' => cma_ai_get_usage_status(),
        ) );
    }

    /**
     * Research and generate a keyword list for one of the Positive/Negative/
     * Neutral fields, given a free-text description of the domain/category.
     */
    public function generate_keywords( $request ) {
        $sentiment = $request->get_param( 'sentiment' );
        $prompt    = trim( (string) $request->get_param( 'prompt' ) );

        if ( '' === $prompt ) {
            return rest_ensure_response( array(
                'success' => false,
                'message' => __( 'Enter a category description first.', 'content-mood-analyzer' ),
            ) );
        }

        if ( cma_ai_limit_reached() ) {
            return rest_ensure_response( array(
                'success'  => false,
                'message'  => __( 'Daily AI request limit reached. Try again after it resets at midnight.', 'content-mood-analyzer' ),
                'ai_usage' => cma_ai_get_usage_status(),
            ) );
        }

        $provider = cma_get_ai_provider();
        $keywords = $provider->generate_keywords( $sentiment, $prompt );

        if ( null === $keywords ) {
            $error = cma_ai_get_last_error();

            return rest_ensure_response( array(
                'success'  => false,
                'message'  => $error ? $error['message'] : __( 'The AI request failed for an unknown reason.', 'content-mood-analyzer' ),
                'ai_usage' => cma_ai_get_usage_status(),
            ) );
        }

        return rest_ensure_response( array(
            'success'  => true,
            'keywords' => implode( ', ', $keywords ),
            'ai_usage' => cma_ai_get_usage_status(),
            'message'  => __( 'Keywords generated.', 'content-mood-analyzer' ),
        ) );
    }

    /**
     * Get posts by sentiment
     */
    public function list( $request ) {
        $sentiment  = $request->get_param( 'sentiment' );
        $page       = $request->get_param( 'page' ) ?: 1;
        $per_page   = $request->get_param( 'per_page' ) ?: 2;
        $sort       = $request->get_param( 'sort' ) ?: 'desc';
        $from_date  = $request->get_param( 'from_date' );
        $to_date    = $request->get_param( 'to_date' );

        $filters = array();

        if ( ! empty( $sentiment ) ) {
            $filters['sentiment'] = $sentiment;
        }

        if ( ! empty( $from_date ) ) {
            $filters['from_date'] = $from_date;
        }

        if ( ! empty( $to_date ) ) {
            $filters['to_date'] = $to_date;
        }

        // Get posts using the model method
        $result = Content_Mood_Data_Model::list( $filters, $per_page, ( $page - 1 ) * $per_page, $sort );

        if ( empty( $result['posts'] ) ) {
            return rest_ensure_response( array(
                'success'          => true,
                'message'          => __( 'No posts found.', 'content-mood-analyzer' ),
                'posts'            => array(),
                'total'            => 0,
                'page'             => $page,
                'per_page'         => $per_page,
                'total_pages'      => 0,
                'sentiment_counts' => Content_Mood_Data_Model::get_sentiment_counts(),
            ) );
        }

        $formatted_posts = array_map(
            function( $post ) {
                $post_type_object = get_post_type_object( $post->post_type );

                return array(
                    'id'              => $post->ID,
                    'title'           => get_the_title( $post->ID ),
                    'excerpt'         => get_the_excerpt( $post->ID ),
                    'permalink'       => get_permalink( $post->ID ),
                    'date'            => get_the_date( '', $post->ID ),
                    'sentiment'       => get_post_meta( $post->ID, '_post_sentiment', true ),
                    'post_type'       => $post->post_type,
                    'post_type_label' => $post_type_object ? $post_type_object->labels->singular_name : $post->post_type,
                    'author'          => get_the_author_meta( 'display_name', $post->post_author ),
                );
            },
            $result['posts']
        );

        $total_pages = ceil( $result['total'] / $per_page );

        // Get sentiment counts for all types
        $sentiment_counts = Content_Mood_Data_Model::get_sentiment_counts();

        /**
         * Filters the posts list.
         *
         * @since 1.0.0
         * @param array $formatted_posts The formatted posts.
         * @param \WP_REST_Request $request The request object.
         */
        $formatted_posts = apply_filters( 'content_mood_analyzer_list_posts', $formatted_posts, $request );

        return rest_ensure_response(
            array(
                'success'          => true,
                'posts'            => $formatted_posts,
                'total'            => $result['total'],
                'page'             => $page,
                'per_page'         => $per_page,
                'total_pages'      => $total_pages,
                'sentiment_counts' => $sentiment_counts,
            ),
            200
        );
    }

    /**
     * Get a single post sentiment details
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
    public function get( $request ) {
        $post_id = $request->get_param( 'id' );
        $post = get_post( $post_id );

        if ( ! $post || $post->post_status !== 'publish' || ! cma_is_post_type_enabled( $post->post_type ) ) {
            return rest_ensure_response( array(
                'success' => false,
                'message' => __( 'Post not found.', 'content-mood-analyzer' ),
            ), 404 );
        }

        $sentiment        = get_post_meta( $post_id, '_post_sentiment', true );
        $post_type_object = get_post_type_object( $post->post_type );

        return rest_ensure_response( array(
            'success' => true,
            'post'    => array(
                'id'              => $post->ID,
                'title'           => get_the_title( $post_id ),
                'content'         => apply_filters( 'the_content', $post->post_content ),
                'excerpt'         => get_the_excerpt( $post_id ),
                'permalink'       => get_permalink( $post_id ),
                'date'            => get_the_date( '', $post_id ),
                'sentiment'       => $sentiment,
                'post_type'       => $post->post_type,
                'post_type_label' => $post_type_object ? $post_type_object->labels->singular_name : $post->post_type,
                'author'          => get_the_author_meta( 'display_name', $post->post_author ),
            ),
        ) );
    }

    /**
     * Get plugin settings
     */
    public function get_settings( $request ) {
        $settings = get_option( $this->option_name, array() );

        $defaults = array(
            'positive_keywords'  => '',
            'negative_keywords'  => '',
            'neutral_keywords'   => '',
            'badge_position'     => 'top',
            'enabled_post_types' => array( 'post' ),
        );

        $settings = wp_parse_args( $settings, $defaults );

        // Provider/model/key are hardcoded now (see cma_get_ai_provider()) -
        // never echo back whatever may be left in the option from before
        // this was locked down.
        unset( $settings['ai_provider'], $settings['ai_model'], $settings['ai_api_key'] );

        return rest_ensure_response( array(
            'success' => true,
            'settings' => $settings,
            'available_post_types' => $this->get_available_post_types(),
            'ai_usage' => cma_ai_get_usage_status(),
        ) );
    }

    /**
     * Public post types the checklist in Settings can offer, as
     * {value, label} pairs. Attachments are excluded - sentiment analysis
     * of media attachments doesn't make sense.
     */
    private function get_available_post_types() {
        $types = get_post_types( array( 'public' => true ), 'objects' );
        unset( $types['attachment'] );

        return array_values( array_map(
            function( $type ) {
                return array(
                    'value' => $type->name,
                    'label' => $type->labels->singular_name,
                );
            },
            $types
        ) );
    }
}