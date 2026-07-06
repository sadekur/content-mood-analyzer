<?php
namespace Content_Mood\Controllers\Common;

defined( 'ABSPATH' ) || exit;

class Assets {

	/**
	 * Constructor to add all hooks.
	 */
	public function __construct() {
		add_action( 'wp_enqueue_scripts', array( $this, 'add_assets' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'add_assets' ) );
	}

	public function add_assets() {
		$load_common_assets = false;

		/**
		 * Localize PHP variables to be used in the JS files
		 *
		 * @since 1.0
		 */
		$localized = array(
			'rest_base'       => esc_url_raw( get_rest_url() ),
			'nonce'           => wp_create_nonce( 'wp_rest' ),
			'logout_url'      => wp_logout_url(),
			'apiUrl' 		  => rest_url('content-mood-analyzer/v1'),
			'ajax_url'        => admin_url( 'admin-ajax.php' ),
			'assets'          => CONTENT_MOOD_ANALYZER_ASSETS,
			'plugin_url'      => CONTENT_MOOD_ANALYZER_URL,
			'strings' 		  => array(
				'bulkUpdating' 	=> __('Analyzing posts...', 'content-mood-analyzer'),
				'bulkSuccess' 	=> __('Successfully analyzed {count} posts!', 'content-mood-analyzer'),
				'bulkError' 	=> __('Error analyzing posts. Please try again.', 'content-mood-analyzer'),
				'cacheClearing' => __('Clearing cache...', 'content-mood-analyzer'),
				'cacheSuccess' 	=> __('Cache cleared successfully!', 'content-mood-analyzer'),
				'cacheError' 	=> __('Error clearing cache. Please try again.', 'content-mood-analyzer'),
				'confirm' 		=> __('This will re-analyze all posts. Continue?', 'content-mood-analyzer'),
				'saveSuccess' 	=> __('Settings saved successfully!', 'content-mood-analyzer'),
        		'saveError'   	=> __('Failed to save settings.', 'content-mood-analyzer'),
			),
		);

		/**
		 * Assets that are required in the specific screens under `wp-admin` only
		 *
		 * @since 1.0
		 */
		if ( is_admin() ) {
			$load_common_assets = true;

			// Enqueue admin-specific CSS (if exists, otherwise skip)
			if ( file_exists(CONTENT_MOOD_ANALYZER_PATH . 'assets/admin/css/settings.css' ) ) {
				wp_enqueue_style(
					'contmoan-settings',
					CONTENT_MOOD_ANALYZER_ASSETS . '/admin/css/settings.css',
					array(),
					CONTENT_MOOD_ANALYZER_VERSION
				);
			}

			// Enqueue admin React CSS bundle
			wp_enqueue_style(
				'contmoan-admin-react',
				CONTENT_MOOD_ANALYZER_URL . 'build/admin.bundle.css',
				array(),
				CONTENT_MOOD_ANALYZER_VERSION
			);

			wp_enqueue_script(
				'contmoan-admin-react',
				CONTENT_MOOD_ANALYZER_URL . 'build/admin.bundle.js',
				array('wp-element', 'wp-components'),
				CONTENT_MOOD_ANALYZER_VERSION,
				true
			);
		}

		/**
		 * Assets that are required in the public-facing screens only
		 *
		 * @since 1.0
		 */
		elseif ( ! is_admin() ) {
			$load_common_assets = true;
			
			// Enqueue public-specific CSS (if exists, otherwise skip)
			if (file_exists(CONTENT_MOOD_ANALYZER_PATH . 'assets/public/css/public.css')) {
				wp_enqueue_style(
					'content-mood-analyzer-public',
					CONTENT_MOOD_ANALYZER_ASSETS . '/public/css/public.css',
					array(),
					CONTENT_MOOD_ANALYZER_VERSION
				);
			}

			// Enqueue public React CSS bundle
			wp_enqueue_style(
				'content-mood-analyzer-public-react',
				CONTENT_MOOD_ANALYZER_URL . 'build/public.bundle.css',
				array(),
				CONTENT_MOOD_ANALYZER_VERSION
			);

			wp_enqueue_script( 
				'content-mood-analyzer-public-react',
				CONTENT_MOOD_ANALYZER_URL . 'build/public.bundle.js',
				array('wp-element', 'wp-components'),
				CONTENT_MOOD_ANALYZER_VERSION, true
			);

			wp_enqueue_script(
				'content-mood-analyzer-public',
				CONTENT_MOOD_ANALYZER_ASSETS . '/public/js/init.js',
				array( 'jquery' ),
				CONTENT_MOOD_ANALYZER_VERSION,
				true
			);
		}

		/**
		 * Assets that are required in both the `wp-admin` and public-facing screens
		 *
		 * @since 1.0
		 */
		if ( $load_common_assets ) {

			// Enqueue common CSS (if exists, otherwise skip)
			if (file_exists(CONTENT_MOOD_ANALYZER_PATH . 'assets/common/css/common.css')) {
				wp_enqueue_style(
					'content-mood-analyzer-common',
					CONTENT_MOOD_ANALYZER_ASSETS . '/common/css/common.css',
					array(),
					CONTENT_MOOD_ANALYZER_VERSION
				);
			}

			// Enqueue the built Tailwind CSS
			wp_enqueue_style(
				'content-mood-analyzer-tailwind',
				CONTENT_MOOD_ANALYZER_URL . 'build/tailwind.build.bundle.css',
				array(),
				CONTENT_MOOD_ANALYZER_VERSION
			);

			wp_enqueue_script(
				'content-mood-analyzer-common',
				CONTENT_MOOD_ANALYZER_ASSETS . '/common/js/common.js',
				array( 'jquery' ),
				CONTENT_MOOD_ANALYZER_VERSION,
				true
			);

			wp_localize_script(
				'content-mood-analyzer-common',
				'CONTENT_MOOD_ANALYZER',
				apply_filters( 'content-mood-analyzer-localized_vars', $localized )
			);
		}
	}
}