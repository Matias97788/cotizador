<?php
if (!class_exists('MTWDespachosMenus')) {
    class MTWDespachosMenus {
        public function __construct() {
            add_action('admin_menu', array($this, 'add_admin_menu'));
        }

        
        public function add_admin_menu() {
            add_menu_page(
                MTW_APP_NAME,
                MTW_APP_NAME,
                'manage_options',
                MTW_PLUGIN_SLUG,
                array($this, 'display_admin_page'),
                'dashicons-car',
                56
            );
        }

        public function display_admin_page() {
            // Implementa la página de administración aquí
            echo '<div class="wrap">';
            echo '<h1>' . MTW_APP_NAME . ' - Panel de Administración</h1>';
            echo '<p>Bienvenido al panel de administración de ' . MTW_APP_NAME . '.</p>';
            echo '</div>';
        }
    }
}