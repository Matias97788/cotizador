<?php
// cotizadormtw2-2/includes/mtw_despachos_settings.php

if (!defined("ABSPATH")) {
    exit();
}

class MTW_Despachos_Settings
{
    private $options;

    public function __construct()
    {
        add_action("admin_menu", [$this, "add_plugin_page"]);
        add_action("admin_init", [$this, "page_init"]);
    }

    public function add_plugin_page()
    {
        add_options_page(
            "Configuración MTW Despachos",
            "MTW Despachos",
            "manage_options",
            "mtw-despachos-settings",
            [$this, "create_admin_page"]
        );
    }

    public function create_admin_page()
    {
        $this->options = get_option("mtw_despachos_settings"); ?>
        <div class="wrap">
            <h1>Configuración MTW Despachos</h1>
            <form method="post" action="options.php">
            <?php
            settings_fields("mtw_despachos_option_group");
            do_settings_sections("mtw-despachos-settings-admin");
            submit_button();?>
            </form>
        </div>
        <?php
    }

    public function page_init()
    {
        register_setting(
            "mtw_despachos_option_group",
            "mtw_despachos_settings",
            [$this, "sanitize"]
        );

        add_settings_section(
            "mtw_despachos_setting_section",
            "Configuración General",
            [$this, "section_info"],
            "mtw-despachos-settings-admin"
        );

        add_settings_field(
            "api_key",
            "API Key",
            [$this, "api_key_callback"],
            "mtw-despachos-settings-admin",
            "mtw_despachos_setting_section"
        );

        add_settings_field(
            "enable_chilexpress",
            "Habilitar Chilexpress",
            [$this, "enable_chilexpress_callback"],
            "mtw-despachos-settings-admin",
            "mtw_despachos_setting_section"
        );

        add_settings_field(
            "enable_bluexpress",
            "Habilitar Bluexpress",
            [$this, "enable_bluexpress_callback"],
            "mtw-despachos-settings-admin",
            "mtw_despachos_setting_section"
        );
    }

    public function sanitize($input)
    {
        $sanitary_values = [];
        if (isset($input["api_key"])) {
            $sanitary_values["api_key"] = sanitize_text_field(
                $input["api_key"]
            );
        }
        if (isset($input["enable_chilexpress"])) {
            $sanitary_values["enable_chilexpress"] =
                $input["enable_chilexpress"];
        }
        if (isset($input["enable_bluexpress"])) {
            $sanitary_values["enable_bluexpress"] = $input["enable_bluexpress"];
        }
        return $sanitary_values;
    }

    public function section_info()
    {
        echo "Ingrese su configuración a continuación:";
    }

    public function api_key_callback()
    {
        printf(
            '<input type="text" class="regular-text" name="mtw_despachos_settings[api_key]" value="%s">',
            isset($this->options["api_key"])
                ? esc_attr($this->options["api_key"])
                : ""
        );
    }

    public function enable_chilexpress_callback()
    {
        printf(
            '<input type="checkbox" name="mtw_despachos_settings[enable_chilexpress]" %s>',
            isset($this->options["enable_chilexpress"]) &&
            $this->options["enable_chilexpress"] === "on"
                ? "checked"
                : ""
        );
    }

    public function enable_bluexpress_callback()
    {
        printf(
            '<input type="checkbox" name="mtw_despachos_settings[enable_bluexpress]" %s>',
            isset($this->options["enable_bluexpress"]) &&
            $this->options["enable_bluexpress"] === "on"
                ? "checked"
                : ""
        );
    }
}


if (is_admin()) {
    $mtw_despachos_settings = new MTW_Despachos_Settings();
}
