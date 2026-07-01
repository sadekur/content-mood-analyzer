<?php
namespace Content_Mood\Controllers\Common;
use WP_REST_Server;
use Content_Mood\API\Content_Mood_Data;
use Content_Mood\Traits\Rest;

defined( 'ABSPATH' ) || exit;

class API {


	use Rest;

    /**
     * Namespace for the API
     */
    // private $namespace = 'content-mood-analyzer/v1';

    /**
     * Constructor to register routes
     */
    public function __construct() {
        add_action('rest_api_init', array($this, 'register_routes'));
    }

    /**
     * Register all REST API routes
     */
    public function register_routes() {
        // Update settings
		$this->register_route(
            '/settings',
            array(
                'methods' => 'POST',
                'callback' => array( new Content_Mood_Data(), 'update_settings' ),
                'permission_callback' => array( $this, 'check_permission' ),
                'args' => array(
                    'positive_keywords' => array(
                        'sanitize_callback' => 'sanitize_textarea_field',
                    ),
                    'negative_keywords' => array(
                        'sanitize_callback' => 'sanitize_textarea_field',
                    ),
                    'neutral_keywords' => array(
                        'sanitize_callback' => 'sanitize_textarea_field',
                    ),
                    'badge_position' => array(
                        'sanitize_callback' => 'sanitize_text_field',
                        'validate_callback' => function( $param ) {
                            return in_array( $param, array( 'top', 'bottom', 'none' ) );
                        }
                    ),
                    'ai_enabled' => array(
                        'sanitize_callback' => 'rest_sanitize_boolean',
                    ),
                    'ai_provider' => array(
                        'sanitize_callback' => 'sanitize_text_field',
                        'validate_callback' => function( $param ) {
                            return in_array( $param, array( 'gemini' ), true );
                        }
                    ),
                    'ai_api_key' => array(
                        'sanitize_callback' => 'sanitize_text_field',
                    ),
                    'ai_api_key_remove' => array(
                        'sanitize_callback' => 'rest_sanitize_boolean',
                    ),
                    'ai_daily_limit' => array(
                        'sanitize_callback' => 'absint',
                        'validate_callback' => function( $param ) {
                            return is_numeric( $param ) && $param >= 1 && $param <= 100000;
                        }
                    ),
                ),
            )
        );

        // Get settings
		register_rest_route( $this->namespace, '/settings', array(
            'methods' => 'GET',
            'callback' => array( new Content_Mood_Data(), 'get_settings' ),
            'permission_callback' => array( $this, 'check_permission' ),
        ));

        // Analyze single post
        register_rest_route( $this->namespace, '/analyze/(?P<id>\d+)', array(
            'methods' => 'POST',
            'callback'   => array( new Content_Mood_Data(), 'analyze_post' ),
            'permission_callback' => array( $this, 'check_permission' ),
            'args' => array(
                'id' => array(
                    'validate_callback' => function( $param ) {
                        return is_numeric( $param );
                    }
                ),
            ),
        ));

        // Bulk analyze all posts
        register_rest_route($this->namespace, '/analyze/bulk', array(
            'methods' => 'POST',
			'callback'   => array( new Content_Mood_Data(), 'bulk_analyze' ),
            'permission_callback' => array($this, 'check_permission'),
        ));

        // Get post sentiment
        register_rest_route( $this->namespace, '/sentiment/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array( new Content_Mood_Data(), 'get_sentiment' ),
            'permission_callback' => array( $this, 'check_permission' ),
            'args' => array(
                'id' => array(
                    'validate_callback' => function( $param ) {
                        return is_numeric( $param );
                    }
                ),
            ),
        ) );

        // Clear cache
        register_rest_route(
            $this->namespace,
            '/cache/clear', array(
            'methods' => 'POST',
			'callback'   => array( new Content_Mood_Data(), 'clear_cache' ),
            'permission_callback' => array( $this, 'check_permission' ),
        ));

        // Get posts by sentiment
        $this->register_route(
            '/posts',
            array(
                'methods'    => WP_REST_Server::READABLE,
                'callback'   => array( new Content_Mood_Data(), 'list' ),
                'args'       => array(
                    'sentiment' => array(
                        'description'       => __( 'Filter by sentiment type', 'content-mood-analyzer' ),
                        'required'          => false,
                        'type'              => 'string',
                        'enum'              => array( 'positive', 'negative', 'neutral' ),
                        'validate_callback' => function( $param ) {
                            if ( empty( $param ) ) {
                                return true;
                            }
                            return in_array( $param, array( 'positive', 'negative', 'neutral' ) );
                        }
                    ),
                    'page' => array(
                        'description' => __( 'Page number for pagination', 'content-mood-analyzer' ),
                        'required'    => false,
                        'type'        => 'integer',
                        'default'     => 1,
                    ),
                    'per_page' => array(
                        'description' => __( 'Number of posts per page', 'content-mood-analyzer' ),
                        'required'    => false,
                        'type'        => 'integer',
                        'default'     => 10,
                    ),
                    'sort' => array(
                        'description' => __( 'Sort order', 'content-mood-analyzer' ),
                        'required'    => false,
                        'type'        => 'string',
                        'default'     => 'desc',
                        'enum'        => array( 'asc', 'desc' ),
                    ),
                    'from_date' => array(
                        'description' => __( 'Filter by from date', 'content-mood-analyzer' ),
                        'required'    => false,
                        'type'        => 'string',
                    ),
                    'to_date' => array(
                        'description' => __( 'Filter by to date', 'content-mood-analyzer' ),
                        'required'    => false,
                        'type'        => 'string',
                    ),
                ),
                'permission_callback' => '__return_true',
            )
        );

        // Get single post sentiment details
        $this->register_route(
            '/posts/(?P<id>\d+)',
            array(
                'methods'    => WP_REST_Server::READABLE,
                'callback'   => array( new Content_Mood_Data(), 'get' ),
                'args'       => array(
                    'id' => array(
                        'description' => __( 'The post ID', 'content-mood-analyzer' ),
                        'required'    => true,
                        'type'        => 'integer',
                    ),
                ),
                'permission_callback' => '__return_true',
            )
        );
    }

    /**
     * Check if user has permission
     */
    public function check_permission() {
        return current_user_can( 'manage_options' );
    }
}