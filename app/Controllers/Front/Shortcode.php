<?php
namespace Content_Mood\Controllers\Front;

defined( 'ABSPATH' ) || exit;

class Shortcode {

	/**
	 * Constructor to add all hooks.
	 */
	public function __construct() {
		add_shortcode('contmoan-sentiment-filter', array($this, 'sentiment_filter_shortcode'));
	}

	/**
     * Sentiment filter shortcode
     */
    public function sentiment_filter_shortcode($atts) {
        $atts = shortcode_atts(array(
            'sentiment' => 'positive',
            'posts_per_page' => 10
        ), $atts);
        
        $sentiment = sanitize_text_field($atts['sentiment']);
        $posts_per_page = intval($atts['posts_per_page']);
        
        // Validate sentiment
        if (!in_array($sentiment, array('positive', 'negative', 'neutral'))) {
            $sentiment = 'positive';
        }
        
        // Get current page for pagination
        $paged = (get_query_var('paged')) ? get_query_var('paged') : 1;
        
        // Check cache
        $cache_key = 'cma_posts_' . $sentiment . '_page_' . $paged . '_per_' . $posts_per_page;
        $cached_output = get_transient($cache_key);
        
        if ($cached_output !== false) {
            return $cached_output;
        }
        
        // Query posts
        $args = array(
            'post_type' => cma_get_enabled_post_types(),
            'post_status' => 'publish',
            'posts_per_page' => $posts_per_page,
            'paged' => $paged,
            'meta_query' => array(
                array(
                    'key' => '_post_sentiment',
                    'value' => $sentiment,
                    'compare' => '='
                )
            )
        );
        
        $query = new \WP_Query($args);
        
        ob_start();
        
        if ($query->have_posts()) {
            echo '<div class="sentiment-filter-posts sentiment-' . esc_attr($sentiment) . '">';
            
            while ($query->have_posts()) {
                $query->the_post();
                ?>
                <article class="sentiment-post">
                    <h3><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
                    <div class="sentiment-post-meta">
                        <span class="post-date"><?php echo get_the_date(); ?></span>
                        <?php echo cma_get_sentiment_badge_html($sentiment); ?>
                    </div>
                    <div class="sentiment-post-excerpt">
                        <?php the_excerpt(); ?>
                    </div>
                </article>
                <?php
            }
            
            // Pagination
            if ($query->max_num_pages > 1) {
                echo '<div class="sentiment-pagination">';
                echo paginate_links(array(
                    'total' => $query->max_num_pages,
                    'current' => $paged,
                    'prev_text' => __('&laquo; Previous', 'content-mood-analyzer'),
                    'next_text' => __('Next &raquo;', 'content-mood-analyzer')
                ));
                echo '</div>';
            }
            
            echo '</div>';
        } else {
            // FIXED: Added esc_html() around $sentiment variable
            echo '<p>' . sprintf(esc_html__('No %s posts found.', 'content-mood-analyzer'), esc_html($sentiment)) . '</p>';
        }
        
        wp_reset_postdata();
        
        $output = ob_get_clean();
        
        // Cache for 1 hour
        set_transient($cache_key, $output, HOUR_IN_SECONDS);
        
        return $output;
    }
}
