<?php
/*
 * Plugin Name: MTW - Cotizador de Despachos
 * Plugin URI: https://www.mejorandotuweb.com
 * Description: Cotizador de despachos para múltiples couriers en chile.
 * Version: 1.0.0
 * Author: Cristian Olivares S.
 * Author URI: https://www.mejorandotuweb.com
 * Requires PHP: 7.0 or greater
 * Requires at least: 5.6
 * Tested up to: 6.4
 * WC requires at least: 4.5
 */

 
if (!defined("ABSPATH")) {
    exit();
}

if (
    in_array(
        "woocommerce/woocommerce.php",
        apply_filters("active_plugins", get_option("active_plugins"))
    )
) {
    define("MTW_PLUGIN_PATH", plugin_dir_path(__FILE__));
    define("MTW_PLUGIN_URL", plugin_dir_url(__FILE__));
    define("MTW_URL", "https://tudominio.com/");
    define("MTW_APP_NAME", "MTW Cotizador");
    define("MTW_PLUGIN_SLUG", "mtw-despachos");
    define("MTW_SUPPORTED_COUNTRIES", ["CL"]);
    define("MTW_CALL_TIMEOUT", 15);
    define("MTW_VERSION", "1.0.0");
    define("MTW_ENDPOINTS", [
        "get_rates" => MTW_URL . "api/v1/rates",
        "get_rates_test_mode" => MTW_URL . "api/integration",
        "create_shipping_label" => MTW_URL . "api/labels/shipping/create",
        "tracking" => MTW_URL . "api/tracking",
    ]);

    // Incluir archivos necesarios
    require_once MTW_PLUGIN_PATH .
        "includes/classes/mtw_despachos_destinos.php";
    require_once MTW_PLUGIN_PATH . "includes/classes/mtw_despachos_calculo.php";
    require_once MTW_PLUGIN_PATH . "includes/classes/mtw_despachos_menus.php";
    require_once MTW_PLUGIN_PATH .
        "includes/classes/mtw_despachos_tracking.php";
    require_once MTW_PLUGIN_PATH . "includes/mtw-field-reorder.php";
    require_once MTW_PLUGIN_PATH . "includes/mtw_despachos_settings.php";

    function mtw_despachos_destinos_init()
    {
        $GLOBALS["mtw_states_places"] = new MTW_States_Places(__FILE__);
    }

    function mtw_enqueue_checkout_scripts()
    {
        if (is_checkout()) {
            wp_enqueue_script(
                "mtw-dynamic-cities",
                plugin_dir_url(__FILE__) . "includes/js/mtw-dynamic-cities.js",
                ["jquery"],
                MTW_VERSION,
                true
            );
            wp_enqueue_script(
                "mtw-force-city-select",
                plugin_dir_url(__FILE__) . "includes/js/force-city-select.js",
                ["jquery"],
                MTW_VERSION,
                true
            );

            wp_localize_script("mtw-dynamic-cities", "mtw_ajax", [
                "ajax_url" => admin_url("admin-ajax.php"),
                "security" => wp_create_nonce("mtw_load_cities"),
            ]);
        }
    }

    function mtw_modify_checkout_fields($fields)
    {
        $fields["billing"]["billing_city"] = [
            "type" => "select",
            "label" => __("Ciudad", "woocommerce"),
            "required" => true,
            "class" => ["form-row-wide", "update_totals_on_change"],
            "options" => ["" => __("Selecciona una ciudad", "woocommerce")],
            "priority" => 70,
        ];

        $fields["shipping"]["shipping_city"] = [
            "type" => "select",
            "label" => __("Ciudad", "woocommerce"),
            "required" => true,
            "class" => ["form-row-wide", "update_totals_on_change"],
            "options" => ["" => __("Selecciona una ciudad", "woocommerce")],
            "priority" => 70,
        ];

        return $fields;
    }

    function mtw_load_cities_ajax()
    {
        check_ajax_referer("mtw_load_cities", "security");

        if (!isset($_POST["region"]) || empty($_POST["region"])) {
            wp_send_json_error("No region specified");
        }

        $region = sanitize_text_field($_POST["region"]);
        $cities = mtw_get_cities_for_region($region);

        if (!empty($cities)) {
            wp_send_json_success($cities);
        } else {
            wp_send_json_error("No cities found for the specified region");
        }
    }

    function mtw_ensure_city_is_select($value, $key)
    {
        if ($key === "billing_city" || $key === "shipping_city") {
            return "select";
        }
        return $value;
    }

    function mtw_force_rebuild_checkout_fields()
    {
        if (isset(WC()->session)) {
            WC()->session->set("reload_checkout", true);
        }
    }

    function mtw_force_city_select($args, $key, $value)
    {
        if ($key === "billing_city" || $key === "shipping_city") {
            $args["type"] = "select";
            $args["options"] = [
                "" => __("Selecciona una ciudad", "woocommerce"),
            ];
        }
        return $args;
    }

    function mtw_enqueue_force_city_select_script()
    {
        if (is_checkout()) {
            wp_enqueue_script(
                "mtw-force-city-select",
                MTW_PLUGIN_URL . "js/force-city-select.js",
                ["jquery"],
                MTW_VERSION,
                true
            );
        }
    }

    function mtw_remove_city_validation($fields)
    {
        if (isset($fields["billing"]["billing_city"]["custom_attributes"])) {
            unset($fields["billing"]["billing_city"]["custom_attributes"]);
        }
        if (isset($fields["shipping"]["shipping_city"]["custom_attributes"])) {
            unset($fields["shipping"]["shipping_city"]["custom_attributes"]);
        }
        return $fields;
    }

    function mtw_force_checkout_update()
    {
        if (is_checkout() && !is_wc_endpoint_url()) {
            WC()->session->set("refresh_totals", true);
        }
    }

    // Hooks
    add_action("plugins_loaded", "mtw_despachos_destinos_init", 1);
    add_action("wp_enqueue_scripts", "mtw_enqueue_checkout_scripts");
    add_filter(
        "woocommerce_checkout_fields",
        "mtw_modify_checkout_fields",
        9999
    );
    add_action("wp_ajax_mtw_load_cities", "mtw_load_cities_ajax");
    add_action("wp_ajax_nopriv_mtw_load_cities", "mtw_load_cities_ajax");
    add_filter(
        "woocommerce_checkout_fields_input_type",
        "mtw_ensure_city_is_select",
        10,
        2
    );
    add_action("init", "mtw_force_rebuild_checkout_fields");
    add_filter("woocommerce_form_field_args", "mtw_force_city_select", 10, 3);
    add_action("wp_enqueue_scripts", "mtw_enqueue_force_city_select_script");
    add_filter(
        "woocommerce_checkout_fields",
        "mtw_remove_city_validation",
        9998
    );
    add_action("wp", "mtw_force_checkout_update");

    // Inicializar las clases
    new MTWDespachosMenus();
    new MTWDespachosTracking();

    // Inicializar la configuración del plugin
    if (is_admin()) {
        new MTW_Despachos_Settings();
    }
}
