<?php
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

// Realiza las acciones de desinstalación aquí

// Por ejemplo, eliminar opciones de la base de datos
delete_option('mtw_despachos_settings');