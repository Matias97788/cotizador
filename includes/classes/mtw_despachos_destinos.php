<?php
if (!class_exists('MTW_States_Places')) {
    class MTW_States_Places {
        private $regions_cache;

        
        public function __construct($file) {
            add_filter('woocommerce_states', array($this, 'add_states'));
            add_filter('woocommerce_cities', array($this, 'add_cities'));
            
            // Inicializar el caché de regiones
            $this->regions_cache = get_transient('mtw_regions_cache');
        }

        public function add_states($states) {
            $chile_states = $this->get_chile_states();
            if (!empty($chile_states)) {
                $states['CL'] = $chile_states;
            }
            return $states;
        }

        public function add_cities($cities) {
            if (!isset($cities['CL'])) {
                $cities['CL'] = array();
            }
            
            $chile_states = $this->get_chile_states();
            foreach ($chile_states as $state_code => $state_name) {
                $cities['CL'][$state_code] = $this->get_cities_for_region($state_code);
               
            }
            
            return $cities;
        }

        private function get_chile_states() {
            if (false === $this->regions_cache) {
                $response = wp_remote_get('https://jellyfish-app-h786r.ondigitalocean.app/api/chilexpress/regions');

                if (is_wp_error($response)) {
                    error_log('Error fetching Chile regions: ' . $response->get_error_message());
                    return array();
                }

                $body = wp_remote_retrieve_body($response);
                $data = json_decode($body, true);

                if (isset($data['regions']) && is_array($data['regions'])) {
                    $regions = array();
                    foreach ($data['regions'] as $region) {
                        $regions[$region['regionId']] = $region['regionName'];
                    }
                    $this->regions_cache = $regions;
                    set_transient('mtw_regions_cache', $regions, DAY_IN_SECONDS); // Cache por 1 día
                } else {
                    error_log('Invalid data structure received from Chile regions API');
                    return array();
                }
            }

            return $this->regions_cache;
        }

        private function get_cities_for_region($region_code) {
            $response = wp_remote_get("https://jellyfish-app-h786r.ondigitalocean.app/api/chilexpress/destinations/{$region_code}");

            if (is_wp_error($response)) {
                error_log("Error fetching cities for region {$region_code}: " . $response->get_error_message());
                return array();
            }

            $body = wp_remote_retrieve_body($response);
            $data = json_decode($body, true);

            if (isset($data) && is_array($data)) {
                $cities = array();
                foreach ($data as $city) {
                    $cities[$city['countyCode']] = $city['countyName'];
                }

                 return $cities;
                
            } else {
                error_log("Invalid data structure received from Chile cities API for region {$region_code}");
                return array();
            }
        }
    }
}