<?php
// cotizadormtw2-2/includes/classes/mtw_despachos_calculo.php

if (!defined("ABSPATH")) {
    exit();
}


function mtw_init_despachos_calculo()
{
    if (!class_exists("WC_Shipping_Method")) {
        return;
    }

    class MTW_Despachos_Calculo extends WC_Shipping_Method
    {
        public function __construct()
        {
            $this->id = "mtw_despachos";
            $this->method_title = MTW_APP_NAME;
            $this->method_description =
                "Cotizador de despachos para múltiples couriers.";
            $this->init();
        }

        function init()
        {
            $this->init_form_fields();
            $this->init_settings();
            $this->enabled = $this->get_option("enabled");
            $this->title = $this->get_option("title");

            add_action("woocommerce_update_options_shipping_" . $this->id, [
                $this,
                "process_admin_options",
            ]);
        }

        function init_form_fields()
        {
            $this->form_fields = [
                "enabled" => [
                    "title" => __("Activar/Desactivar", "woocommerce"),
                    "type" => "checkbox",
                    "label" => __(
                        "Activar este método de envío",
                        "woocommerce"
                    ),
                    "default" => "yes",
                ],
                "title" => [
                    "title" => __("Título", "woocommerce"),
                    "type" => "text",
                    "description" => __(
                        "Esto controla el título que el usuario ve durante el checkout.",
                        "woocommerce"
                    ),
                    "default" => __("MTW Despachos", "woocommerce"),
                    "desc_tip" => true,
                ],
                // Puedes agregar más campos de configuración aquí si es necesario
            ];
        }

        public function calculate_shipping($package = [])
        {
            $rate = [
                "id" => $this->id,
                "label" => $this->title,
                "cost" => 0,
                "calc_tax" => "per_order",
            ];

            // Aquí deberías implementar la lógica para calcular el costo de envío
            // Por ahora, establecemos un costo fijo de 0 como ejemplo

            $this->add_rate($rate);
        }
    }

    add_filter("woocommerce_shipping_methods", "add_mtw_despachos_method");
}

function add_mtw_despachos_method($methods)
{
    $methods["mtw_despachos"] = "MTW_Despachos_Calculo";
    return $methods;
}

add_action("woocommerce_shipping_init", "mtw_init_despachos_calculo");
