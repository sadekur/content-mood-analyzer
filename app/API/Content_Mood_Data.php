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
            'positive_keywords' => '',
            'negative_keywords' => '',
            'neutral_keywords'  => '',
            'badge_position'    => 'top',
            'ai_enabled'        => false,
            'ai_provider'       => 'gemini',
            'ai_api_key'        => '',
            'ai_daily_limit'    => 100,
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

        if ( $request->has_param( 'ai_enabled' ) ) {
            $current['ai_enabled'] = (bool) $request->get_param( 'ai_enabled' );
            $updated_fields[] = 'ai_enabled';
        }

        if ( $request->has_param( 'ai_provider' ) ) {
            $current['ai_provider'] = $request->get_param( 'ai_provider' );
            $updated_fields[] = 'ai_provider';
        }

        if ( $request->has_param( 'ai_api_key' ) ) {
            // A blank value keeps the previously saved key - the settings
            // screen never receives the real key back, so it always submits
            // blank unless the user actually typed a new one.
            $new_key = $request->get_param( 'ai_api_key' );
            if ( '' !== $new_key ) {
                $current['ai_api_key'] = $new_key;
                $updated_fields[] = 'ai_api_key';
            }
        }

        if ( $request->has_param( 'ai_daily_limit' ) ) {
            $current['ai_daily_limit'] = (int) $request->get_param( 'ai_daily_limit' );
            $updated_fields[] = 'ai_daily_limit';
        }

        // Save as single array
        $saved = update_option( $this->option_name, $current );

        if ( $saved ) {
            if ( in_array( 'positive_keywords', $updated_fields ) ||
                in_array( 'negative_keywords', $updated_fields ) ||
                in_array( 'neutral_keywords', $updated_fields ) ) {
                cma_clear_sentiment_cache();
            }

            $response_settings                    = $current;
            $response_settings['ai_api_key_set']  = ! empty( $current['ai_api_key'] );
            $response_settings['ai_api_key']      = '';

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

        if ( $post->post_type !== 'post' ) {
            return new \WP_Error(
                'invalid_post_type',
                __( 'Only posts can be analyzed.', 'content-mood-analyzer' ),
                array( 'status' => 400 )
            );
        }

        // Analyze sentiment
        $sentiment = cma_perform_sentiment_analysis( $post );

        return rest_ensure_response( array(
            'success' => true,
            'post_id' => $post_id,
            'sentiment' => $sentiment,
            'source' => get_post_meta( $post_id, '_post_sentiment_source', true ),
            'ai_usage' => cma_ai_get_usage_status(),
            'message' => __( 'Post analyzed successfully.', 'content-mood-analyzer' ),
        ) );
    }

    /**
     * Bulk analyze all posts
     */
    public function bulk_analyze( $request ) {
        // Get all published posts
        $args = array(
            'post_type' => 'post',
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'fields' => 'ids'
        );

        $post_ids = get_posts( $args );
        $analyzed = 0;
        $results = array();

        foreach ( $post_ids as $post_id ) {
            $post = get_post( $post_id );
            if ( $post ) {
                $sentiment = cma_perform_sentiment_analysis( $post );
                $results[] = array(
                    'post_id' => $post_id,
                    'sentiment' => $sentiment,
                );
                $analyzed++;
            }
        }

        // Clear all caches
        cma_clear_sentiment_cache();

        return rest_ensure_response( array(
            'success' => true,
            'analyzed' => $analyzed,
            'total' => count( $post_ids ),
            'results' => $results,
            'message' => sprintf(
                __( 'Analyzed %d posts successfully.', 'content-mood-analyzer' ),
                $analyzed
            ),
        ));
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
                return array(
                    'id'        => $post->ID,
                    'title'     => get_the_title( $post->ID ),
                    'excerpt'   => get_the_excerpt( $post->ID ),
                    'permalink' => get_permalink( $post->ID ),
                    'date'      => get_the_date( '', $post->ID ),
                    'sentiment' => get_post_meta( $post->ID, '_post_sentiment', true ),
                    'author'    => get_the_author_meta( 'display_name', $post->post_author ),
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

        if ( ! $post || $post->post_status !== 'publish' ) {
            return rest_ensure_response( array(
                'success' => false,
                'message' => __( 'Post not found.', 'content-mood-analyzer' ),
            ), 404 );
        }

        $sentiment = get_post_meta( $post_id, '_post_sentiment', true );

        return rest_ensure_response( array(
            'success' => true,
            'post'    => array(
                'id'        => $post->ID,
                'title'     => get_the_title( $post_id ),
                'content'   => apply_filters( 'the_content', $post->post_content ),
                'excerpt'   => get_the_excerpt( $post_id ),
                'permalink' => get_permalink( $post_id ),
                'date'      => get_the_date( '', $post_id ),
                'sentiment' => $sentiment,
                'author'    => get_the_author_meta( 'display_name', $post->post_author ),
            ),
        ) );
    }

    /**
     * Get plugin settings
     */
    public function get_settings( $request ) {
        $settings = get_option( $this->option_name, array() );

        $defaults = array(
            'positive_keywords' => '',
            'negative_keywords' => '',
            'neutral_keywords'  => '',
            'badge_position'    => 'top',
        );

        $settings = wp_parse_args( $settings, $defaults );

        return rest_ensure_response( array(
            'success' => true,
            'settings' => $settings,
        ) );
    }
}