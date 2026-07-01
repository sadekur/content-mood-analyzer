<?php
namespace Content_Mood\Controllers\Admin;
use Content_Mood\Traits\Hook;

defined( 'ABSPATH' ) || exit;

class Menu {
    use Hook;

    public function __construct() {
        $this->action( 'admin_menu', [ $this, 'register_menus' ] );
        // $this->action( 'admin_enqueue_scripts', [ $this, 'enqueue_menu_script' ] );
    }

    public function register_menus() {
        // Main top-level menu (Overview/Landing page - NO hash)
        add_menu_page(
            __( 'Content Mood Analyzer', 'content-mood-analyzer' ),
            __( 'Content Mood Analyzer', 'content-mood-analyzer' ),
            'manage_options',
            'content-mood-analyzer',
            [ $this, 'render_main_page' ],
            'dashicons-chart-line',
            30
        );

        // Overview submenu (same as parent - NO hash)
        add_submenu_page(
            'content-mood-analyzer',
            __( 'Overview', 'content-mood-analyzer' ),
            __( 'Overview', 'content-mood-analyzer' ),
            'manage_options',
            'content-mood-analyzer',
            [ $this, 'render_main_page' ]
        );

        // Dashboard submenu (WITH hash)
        add_submenu_page(
            'content-mood-analyzer',
            __( 'Dashboard', 'content-mood-analyzer' ),
            __( 'Dashboard', 'content-mood-analyzer' ),
            'manage_options',
            'content-mood-analyzer#/dashboard',
            [ $this, 'render_main_page' ]
        );

        // All Sentiments submenu
        add_submenu_page(
            'content-mood-analyzer',
            __( 'All Sentiments', 'content-mood-analyzer' ),
            __( 'All Sentiments', 'content-mood-analyzer' ),
            'manage_options',
            'content-mood-analyzer#/sentiments',
            [ $this, 'render_main_page' ]
        );

        // Settings submenu
        add_submenu_page(
            'content-mood-analyzer',
            __( 'Settings', 'content-mood-analyzer' ),
            __( 'Settings', 'content-mood-analyzer' ),
            'manage_options',
            'content-mood-analyzer#/settings',
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