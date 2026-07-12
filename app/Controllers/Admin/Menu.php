<?php
namespace Contmoan\Controllers\Admin;
use Contmoan\Traits\Hook;

defined( 'ABSPATH' ) || exit;

class Menu {
    use Hook;

    public function __construct() {
        $this->action( 'admin_menu', [ $this, 'register_menus' ] );
        $this->action( 'in_admin_header', [ $this, 'hide_unrelated_admin_notices' ] );
        // $this->action( 'admin_enqueue_scripts', [ $this, 'enqueue_menu_script' ] );
    }

    /**
     * Suppress WordPress core and other plugins' admin notices on our
     * screens so they don't clutter the plugin's own UI. All four submenus
     * share the same top-level screen (they only differ by URL hash), so
     * one screen id check covers Overview, Dashboard, All Sentiments, and
     * Settings.
     */
    public function hide_unrelated_admin_notices() {
        $screen = get_current_screen();

        if ( $screen && 'toplevel_page_contmoan' === $screen->id ) {
            remove_all_actions( 'admin_notices' );
            remove_all_actions( 'all_admin_notices' );
        }
    }

    public function register_menus() {
        // Main top-level menu (Overview/Landing page - NO hash)
        add_menu_page(
            __( 'Content Mood Analyzer', 'content-mood-analyzer' ),
            __( 'Content Mood Analyzer', 'content-mood-analyzer' ),
            'manage_options',
            'contmoan',
            [ $this, 'render_main_page' ],
            'dashicons-chart-line',
            30
        );

        // Overview submenu (same as parent - NO hash)
        add_submenu_page(
            'contmoan',
            __( 'Overview', 'content-mood-analyzer' ),
            __( 'Overview', 'content-mood-analyzer' ),
            'manage_options',
            'contmoan',
            [ $this, 'render_main_page' ]
        );

        // Dashboard submenu (WITH hash)
        add_submenu_page(
            'contmoan',
            __( 'Dashboard', 'content-mood-analyzer' ),
            __( 'Dashboard', 'content-mood-analyzer' ),
            'manage_options',
            'contmoan#/dashboard',
            [ $this, 'render_main_page' ]
        );

        // All Sentiments submenu
        add_submenu_page(
            'contmoan',
            __( 'All Sentiments', 'content-mood-analyzer' ),
            __( 'All Sentiments', 'content-mood-analyzer' ),
            'manage_options',
            'contmoan#/sentiments',
            [ $this, 'render_main_page' ]
        );

        // Settings submenu
        add_submenu_page(
            'contmoan',
            __( 'Settings', 'content-mood-analyzer' ),
            __( 'Settings', 'content-mood-analyzer' ),
            'manage_options',
            'contmoan#/settings',
            [ $this, 'render_main_page' ]
        );
    }

    public function render_main_page() {
        echo '<div class="wrap"><div id="sentiment-root">Loading...</div></div>';
    }

    /**
     * Enqueue script to handle hash-based navigation in WordPress admin menu
     */
    public function enqueue_menu_script() {
        $screen = get_current_screen();
        
        // Only load on our plugin pages
        if ( ! $screen || strpos( $screen->id, 'content-mood-analyzer' ) === false ) {
            return;
        }
    }
}