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

		// Fixed AI keyword-research credentials - not user configurable, so
		// every install uses this key/model with no setup required. The key
		// itself is never committed to source; define it in wp-config.php:
		//   define( 'CONTENT_MOOD_ANALYZER_GEMINI_API_KEY', 'your-key-here' );
		if ( ! defined( 'CONTENT_MOOD_ANALYZER_GEMINI_API_KEY' ) ) {
			define( 'CONTENT_MOOD_ANALYZER_GEMINI_API_KEY', '' );
		}
		if ( ! defined( 'CONTENT_MOOD_ANALYZER_GEMINI_MODEL' ) ) {
			define( 'CONTENT_MOOD_ANALYZER_GEMINI_MODEL', 'gemini-2.5-flash' );
		}
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