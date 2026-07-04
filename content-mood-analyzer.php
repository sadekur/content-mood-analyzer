<?php
/**
 * Plugin Name:       Content Mood Analyzer
 * Plugin URI:        https://sadekurrahman.net
 * Description:       A WordPress plugin to analyze mood of post content for positive, negative, or neutral.
 * Version:           1.0.0
 * Requires at least: 6.1
 * Requires PHP:      7.4
 * Author:            Sadekur Rahman
 * Author URI:        https://sadekurrahman.net
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       content-mood-analyzer
 * Domain Path:       /languages
 *
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/vendor/autoload.php';

/**
 * The main plugin class
 */
final class Content_Mood_Analyzer{

	/**
	 * Plugin version
	 *
	 * @var string
	 */
	const version = '1.0';

	/**
	 * Class construcotr
	 */
	private function __construct() {
		$this->define_constants();

		add_action( 'init', [ $this, 'init_plugin' ] );
	}

	public static function init() {
		static $instance = false;

		if ( ! $instance ) {
			$instance = new self();
		}

		return $instance;
	}

	/**
	 * Define the required plugin constants
	 *
	 * @return void
	 */
	public function define_constants() {
		define( 'CONTENT_MOOD_ANALYZER_VERSION', self::version );
		define( 'CONTENT_MOOD_ANALYZER_FILE', __FILE__ );
		define( 'CONTENT_MOOD_ANALYZER_PATH', plugin_dir_path(__FILE__) );
		define( 'CONTENT_MOOD_ANALYZER_URL', plugin_dir_url(__FILE__) );
		define( 'CONTENT_MOOD_ANALYZER_ASSETS', CONTENT_MOOD_ANALYZER_URL . 'assets/' );

		// AI keyword research goes through the plugin's Cloudflare Worker
		// proxy (see /cloudflare-worker) - not user configurable, so every
		// install works with no setup. Neither value below is a real secret:
		// the URL is just a public endpoint, and the token only filters out
		// drive-by requests (the real Gemini key lives solely in the
		// Worker's own secrets, never in this plugin's source).
		define( 'CONTENT_MOOD_ANALYZER_AI_PROXY_URL', 'https://content-mood-analyzer-ai-proxy.soikut.workers.dev' );
		define( 'CONTENT_MOOD_ANALYZER_AI_PROXY_TOKEN', 'b6fed5e964baaa2dcd3c7969870f84c70791b7cd02afdf5e' );
	}

	/**
	 * Initialize the plugin
	 *
	 * @return void
	 */
	public function init_plugin() {

		cma_migrate_legacy_settings_option();

		new Content_Mood\Controllers\Common\Assets();
		new Content_Mood\Controllers\Common\Activation();
		new Content_Mood\Controllers\Common\API();

		// if ( defined( 'DOING_AJAX' ) && DOING_AJAX ) {
		// 	 new Content_Mood\Controllers\Common\Ajax();
		// }

		if ( is_admin() ) {
			new Content_Mood\Controllers\Admin\Menu();
		} else {
			new Content_Mood\Controllers\Front\Shortcode();
		    new Content_Mood\Controllers\Front\Front();
		}

	}
}
function content_mood_analyzer() {
	return Content_Mood_Analyzer::init();
}

content_mood_analyzer();