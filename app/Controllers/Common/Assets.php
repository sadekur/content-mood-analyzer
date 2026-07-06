<?php
namespace Contmoan\Controllers\Common;

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
			'assets'          => CONTMOAN_ASSETS,
			'plugin_url'      => CONTMOAN_URL,
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
			if ( file_exists(CONTMOAN_PATH . 'assets/admin/css/settings.css' ) ) {
				wp_enqueue_style(
					'contmoan-settings',
					CONTMOAN_ASSETS . '/admin/css/settings.css',
					array(),
					CONTMOAN_VERSION
				);
			}

			// Enqueue admin React CSS bundle
			wp_enqueue_style(
				'contmoan-admin-react',
				CONTMOAN_URL . 'build/admin.bundle.css',
				array(),
				CONTMOAN_VERSION
			);

			wp_enqueue_script(
				'contmoan-admin-react',
				CONTMOAN_URL . 'build/admin.bundle.js',
				array('wp-element', 'wp-components'),
				CONTMOAN_VERSION,
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
			if (file_exists(CONTMOAN_PATH . 'assets/public/css/public.css')) {
				wp_enqueue_style(
					'contmoan-public',
					CONTMOAN_ASSETS . '/public/css/public.css',
					array(),
					CONTMOAN_VERSION
				);
			}

			// Enqueue public React CSS bundle
			wp_enqueue_style(
				'contmoan-public-react',
				CONTMOAN_URL . 'build/public.bundle.css',
				array(),
				CONTMOAN_VERSION
			);

			wp_enqueue_script( 
				'contmoan-public-react',
				CONTMOAN_URL . 'build/public.bundle.js',
				array('wp-element', 'wp-components'),
				CONTMOAN_VERSION, true
			);

			wp_enqueue_script(
				'contmoan-public',
				CONTMOAN_ASSETS . '/public/js/init.js',
				array( 'jquery' ),
				CONTMOAN_VERSION,
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
			if (file_exists(CONTMOAN_PATH . 'assets/common/css/common.css')) {
				wp_enqueue_style(
					'contmoan-common',
					CONTMOAN_ASSETS . '/common/css/common.css',
					array(),
					CONTMOAN_VERSION
				);
			}

			// Enqueue the built Tailwind CSS
			wp_enqueue_style(
				'contmoan-tailwind',
				CONTMOAN_URL . 'build/tailwind.build.bundle.css',
				array(),
				CONTMOAN_VERSION
			);

			wp_enqueue_script(
				'contmoan-common',
				CONTMOAN_ASSETS . '/common/js/common.js',
				array( 'jquery' ),
				CONTMOAN_VERSION,
				true
			);

			wp_localize_script(
				'contmoan-common',
				'CONTMOAN',
				apply_filters( 'contmoan_localized_vars', $localized )
			);
		}
	}
}