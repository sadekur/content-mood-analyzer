<?php
namespace Content_Mood\Services\AI;

defined( 'ABSPATH' ) || exit;

/**
 * Interface for pluggable AI sentiment providers.
 *
 * Implementations call an external LLM API and return a structured
 * sentiment result, or null if the call failed or produced no usable
 * result. Callers must be able to fall back to the keyword-based
 * analysis whenever null is returned.
 */
interface Provider_Interface {

	/**
	 * Classify the sentiment of a piece of content.
	 *
	 * @param string $title   Post title.
	 * @param string $content Post content (HTML allowed, provider is responsible for stripping it).
	 *
	 * @return array{sentiment:string,confidence:?float}|null
	 */
	public function analyze( $title, $content );
}
