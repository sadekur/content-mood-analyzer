<?php
namespace Contmoan\Controllers\Common;

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
        flush_rewrite_rules();
    }

	/**
     * Plugin deactivation
     */
    public function deactivate() {
        // Clear all sentiment transients
        contmoan_clear_sentiment_cache();

        // Stop any in-progress background bulk analysis - nothing will call
        // contmoan_process_bulk_batch() again once deactivated, so leaving it
        // scheduled/"running" would just be a stale cron event and a stuck
        // progress bar if the plugin is reactivated later.
        wp_clear_scheduled_hook( 'contmoan_process_bulk_batch' );
        contmoan_cancel_bulk_queue();

        flush_rewrite_rules();
    }
}