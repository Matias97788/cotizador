<?php
if (!defined("ABSPATH")) {
    exit();
}


function mtw_reorder_checkout_fields($fields)
{
    function mtw_reorder_checkout_fields($fields)
    {
        if (isset($fields["billing"]) && isset($fields["shipping"])) {
            // Reordenar campos de facturación
            if (
                isset($fields["billing"]["billing_state"]) &&
                isset($fields["billing"]["billing_city"])
            ) {
                $billing_state = $fields["billing"]["billing_state"];
                unset($fields["billing"]["billing_state"]);
                $new_billing = [];
                foreach ($fields["billing"] as $key => $value) {
                    if ($key === "billing_city") {
                        $new_billing["billing_state"] = $billing_state;
                    }
                    $new_billing[$key] = $value;
                }
                $fields["billing"] = $new_billing;
            }

            // Reordenar campos de envío
            if (
                isset($fields["shipping"]["shipping_state"]) &&
                isset($fields["shipping"]["shipping_city"])
            ) {
                $shipping_state = $fields["shipping"]["shipping_state"];
                unset($fields["shipping"]["shipping_state"]);
                $new_shipping = [];
                foreach ($fields["shipping"] as $key => $value) {
                    if ($key === "shipping_city") {
                        $new_shipping["shipping_state"] = $shipping_state;
                    }
                    $new_shipping[$key] = $value;
                }
                $fields["shipping"] = $new_shipping;
            }
        }
        return $fields;
    }
    add_filter(
        "woocommerce_checkout_fields",
        "mtw_reorder_checkout_fields",
        9999
    );
}
