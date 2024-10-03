<?php
if (!class_exists('MTWDespachosTracking')) {
    class MTWDespachosTracking {
        public function __construct() {
            add_shortcode('mtw_seguimiento', array($this, 'tracking_shortcode'));
        }

        
        public function tracking_shortcode($atts) {
            // Implementa el shortcode de seguimiento aquí
            ob_start();
            ?>
            <form id="mtw-tracking-form">
                <input type="text" name="tracking_number" placeholder="Número de seguimiento">
                <button type="submit">Rastrear</button>
            </form>
            <div id="mtw-tracking-result"></div>
            <?php
            return ob_get_clean();
        }
    }
}