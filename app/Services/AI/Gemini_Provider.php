<?php
namespace Content_Mood\Services\AI;

defined( 'ABSPATH' ) || exit;

/**
 * Sentiment classification via the Google Gemini free tier
 * (https://ai.google.dev/gemini-api/docs/rate-limits).
 */
class Gemini_Provider implements Provider_Interface {

	/**
	 * Model kept on the free tier. Overridable via the
	 * `content_mood_analyzer_gemini_model` filter.
	 *
	 * @var string
	 */
	private $model = 'gemini-2.0-flash';

	/**
	 * @var string
	 */
	private $api_key;

	/**
	 * @param string      $api_key
	 * @param string|null $model Model ID to use instead of the default, e.g. from
	 *                           the `ai_model` setting. Falls back to the default
	 *                           when empty.
	 */
	public function __construct( $api_key, $model = null ) {
		$this->api_key = $api_key;
		$this->model   = apply_filters( 'content_mood_analyzer_gemini_model', $model ?: $this->model );
	}

	/**
	 * @inheritDoc
	 */
	public function analyze( $title, $content ) {
		if ( empty( $this->api_key ) ) {
			cma_ai_set_last_error( __( 'No Gemini API key is configured.', 'content-mood-analyzer' ) );
			return null;
		}

		$text = mb_substr( wp_strip_all_tags( $content ), 0, 4000 );

		$prompt = sprintf(
			"Classify the overall sentiment of this blog post as exactly one of: positive, negative, neutral.\n\nTitle: %s\n\nContent: %s",
			wp_strip_all_tags( $title ),
			$text
		);

		$endpoint = sprintf(
			'https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s',
			rawurlencode( $this->model ),
			rawurlencode( $this->api_key )
		);

		$response = wp_remote_post(
			$endpoint,
			array(
				'timeout' => 15,
				'headers' => array( 'Content-Type' => 'application/json' ),
				'body'    => wp_json_encode(
					array(
						'contents'         => array(
							array( 'parts' => array( array( 'text' => $prompt ) ) ),
						),
						'generationConfig' => array(
							'temperature'      => 0,
							'responseMimeType' => 'application/json',
							'responseSchema'   => array(
								'type'       => 'OBJECT',
								'properties' => array(
									'sentiment'  => array(
										'type' => 'STRING',
										'enum' => array( 'positive', 'negative', 'neutral' ),
									),
									'confidence' => array( 'type' => 'NUMBER' ),
								),
								'required'   => array( 'sentiment', 'confidence' ),
							),
						),
					)
				),
			)
		);

		// Every attempt that reaches the network counts against the free-tier quota,
		// whether or not Gemini returns a usable result.
		cma_ai_record_usage();

		if ( is_wp_error( $response ) ) {
			cma_ai_set_last_error(
				sprintf(
					/* translators: %s: underlying network error message */
					__( 'Could not reach Gemini: %s', 'content-mood-analyzer' ),
					$response->get_error_message()
				)
			);
			return null;
		}

		$status = (int) wp_remote_retrieve_response_code( $response );
		$body   = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( 200 !== $status ) {
			$api_message = $body['error']['message'] ?? null;

			cma_ai_set_last_error(
				$api_message
					? sprintf( '(HTTP %d) %s', $status, $api_message )
					: sprintf(
						/* translators: %d: HTTP status code returned by Gemini */
						__( 'Gemini API request failed with HTTP %d.', 'content-mood-analyzer' ),
						$status
					)
			);
			return null;
		}

		$raw_text = $body['candidates'][0]['content']['parts'][0]['text'] ?? null;

		if ( empty( $raw_text ) ) {
			cma_ai_set_last_error( __( 'Gemini returned an empty response.', 'content-mood-analyzer' ) );
			return null;
		}

		$parsed = json_decode( $raw_text, true );

		if ( ! is_array( $parsed ) || empty( $parsed['sentiment'] ) ) {
			cma_ai_set_last_error( __( 'Gemini returned a response in an unexpected format.', 'content-mood-analyzer' ) );
			return null;
		}

		$sentiment = strtolower( $parsed['sentiment'] );

		if ( ! in_array( $sentiment, array( 'positive', 'negative', 'neutral' ), true ) ) {
			cma_ai_set_last_error( __( 'Gemini returned an unrecognized sentiment value.', 'content-mood-analyzer' ) );
			return null;
		}

		$confidence = isset( $parsed['confidence'] ) ? max( 0, min( 1, (float) $parsed['confidence'] ) ) : null;

		cma_ai_clear_last_error();

		return array(
			'sentiment'  => $sentiment,
			'confidence' => $confidence,
		);
	}
}
