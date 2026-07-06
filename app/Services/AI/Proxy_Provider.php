<?php
namespace Contmoan\Services\AI;

defined( 'ABSPATH' ) || exit;

/**
 * Keyword research via the plugin's Cloudflare Worker proxy (see
 * /cloudflare-worker in this plugin's repo for the Worker source). The real
 * Gemini key lives only in the Worker's secrets - no install of this plugin
 * ever needs its own key.
 */
class Proxy_Provider implements Provider_Interface {

	/**
	 * @var string
	 */
	private $endpoint;

	/**
	 * @var string
	 */
	private $auth_token;

	/**
	 * @param string $endpoint   Full URL of the deployed Worker.
	 * @param string $auth_token Shared, non-secret token the Worker checks
	 *                           before forwarding to Gemini - just filters
	 *                           out drive-by requests, not a real credential
	 *                           (the actual Gemini key never leaves the
	 *                           Worker).
	 */
	public function __construct( $endpoint, $auth_token ) {
		$this->endpoint   = $endpoint;
		$this->auth_token = $auth_token;
	}

	/**
	 * @inheritDoc
	 */
	public function generate_keywords( $sentiment, $category_prompt ) {
		$response = wp_remote_post(
			$this->endpoint,
			array(
				'timeout' => 20,
				'headers' => array(
					'Content-Type'  => 'application/json',
					'X-Plugin-Auth' => $this->auth_token,
				),
				'body'    => wp_json_encode(
					array(
						'sentiment' => $sentiment,
						'prompt'    => $category_prompt,
					)
				),
			)
		);

		// Every attempt that reaches the network counts against the shared
		// daily quota, whether or not the proxy returns a usable result.
		contmoan_ai_record_usage();

		if ( is_wp_error( $response ) ) {
			contmoan_ai_set_last_error(
				sprintf(
					/* translators: %s: underlying network error message */
					__( 'Could not reach the AI proxy: %s', 'content-mood-analyzer' ),
					$response->get_error_message()
				)
			);
			return null;
		}

		$status = (int) wp_remote_retrieve_response_code( $response );
		$body   = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( 200 !== $status || empty( $body['success'] ) ) {
			contmoan_ai_set_last_error(
				! empty( $body['message'] )
					? $body['message']
					: sprintf(
						/* translators: %d: HTTP status code returned by the proxy */
						__( 'AI proxy request failed with HTTP %d.', 'content-mood-analyzer' ),
						$status
					)
			);
			return null;
		}

		$keywords = isset( $body['keywords'] )
			? array_filter( array_map( 'sanitize_text_field', (array) $body['keywords'] ) )
			: array();

		if ( empty( $keywords ) ) {
			contmoan_ai_set_last_error( __( 'The AI proxy did not return any usable keywords.', 'content-mood-analyzer' ) );
			return null;
		}

		contmoan_ai_clear_last_error();

		return array_values( $keywords );
	}
}
