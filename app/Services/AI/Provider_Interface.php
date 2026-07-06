<?php
namespace Contmoan\Services\AI;

defined( 'ABSPATH' ) || exit;

/**
 * Interface for pluggable AI keyword-research providers.
 *
 * Implementations call an external LLM API to research and generate a
 * keyword list for one sentiment category, given a free-text description of
 * the domain/context (e.g. "Customer & Product Reviews"). Used only to help
 * populate the Positive/Negative/Neutral Keywords fields - it does not
 * classify posts directly, that's always done by counting keywords.
 */
interface Provider_Interface {

	/**
	 * Generate a keyword list for one sentiment category.
	 *
	 * @param string $sentiment       One of 'positive', 'negative', 'neutral'.
	 * @param string $category_prompt Free-text description of the domain/context
	 *                                to research keywords for, e.g.
	 *                                "Financial & Economic Context".
	 *
	 * @return string[]|null List of keyword strings, or null on failure.
	 */
	public function generate_keywords( $sentiment, $category_prompt );
}
