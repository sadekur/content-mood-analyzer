<?php
namespace Content_Mood\Controllers\Common;

defined( 'ABSPATH' ) || exit;

class Activation {

	/**
	 * Constructor to add all hooks.
	 */
	public function __construct() {
		register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
	}

	/**
     * Plugin activation
     */
    public function activate() {
        // Set default keyword lists if not exists
        if (!get_option('cma_positive_keywords')) {
            update_option('cma_positive_keywords', "good, great, excellent, amazing, wonderful, fantastic, love, happy, perfect, best, awesome, brilliant, outstanding, superb, terrific");
        }
        
        if (!get_option('cma_negative_keywords')) {
            update_option('cma_negative_keywords', "bad, terrible, awful, horrible, poor, worst, hate, disappointing, disappointing, fail, failed, useless, pathetic, disaster, garbage");
        }
        
        if (!get_option('cma_neutral_keywords')) {
            update_option('cma_neutral_keywords', "okay, ok, average, decent, fair, moderate, acceptable, reasonable, standard, normal");
        }
        
        // Set default badge position
        if (!get_option('cma_badge_position')) {
            update_option('cma_badge_position', 'top');
        }
        
        flush_rewrite_rules();
    }

	/**
     * Plugin deactivation
     */
    public function deactivate() {
        // Clear all sentiment transients
        cma_clear_sentiment_cache();

        // Stop any in-progress background bulk analysis - nothing will call
        // cma_process_bulk_batch() again once deactivated, so leaving it
        // scheduled/"running" would just be a stale cron event and a stuck
        // progress bar if the plugin is reactivated later.
        wp_clear_scheduled_hook( 'cma_process_bulk_batch' );
        cma_cancel_bulk_queue();

        flush_rewrite_rules();
    }
}