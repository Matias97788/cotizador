document.addEventListener("DOMContentLoaded", function () {
  // Variable global para almacenar el subtotal original
  let subtotalOriginal = 0;

  // Agregar estilos CSS
  const estilos = `
    #billing-city_select, #shipping-city_select {
      height: 50px;
      font-size: 18px;
      font-weight: 300;
      text-transform: uppercase;
      padding: 10px;
      background-color: white;
      border: 1px solid;
      border-radius: 5px;
      width: 100%;
    }
    #chilexpress-resultado, #bluexpress-resultado {
      margin-top: 10px;
      padding: 10px;
      background-color: #f0f0f0;
      border: 1px solid #ddd;
      border-radius: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .chilexpress-texto, .bluexpress-texto {
      font-weight: bold;
    }
    .chilexpress-valor, .bluexpress-valor {
      font-weight: normal;
    }
    .chilexpress-radio, .bluexpress-radio {
      margin-left: 10px;
    }
    .select2-container--focus .select2-selection,
    .select2-container--open .select2-selection {
      border: 1px solid #8c8f94 !important;
      box-shadow: 0 0 0 1px #007cba !important;
    }
    .chilexpress-logo, .bluexpress-logo {
      width: 140px;
      height: auto;
      vertical-align: middle;
    }
    #chilexpress-resultado, #bluexpress-resultado {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    #chilexpress-resultado .wc-block-components-totals-item__label,
    #bluexpress-resultado .wc-block-components-totals-item__label {
      flex: 1;
    }
    #chilexpress-resultado .wc-block-components-totals-item__value,
    #bluexpress-resultado .wc-block-components-totals-item__value {
      margin-right: 10px;
    }
    #chilexpress-radio, #bluexpress-radio {
      margin-left: 10px;
      vertical-align: middle;
    }
  `;

  const elementoEstilo = document.createElement("style");
  elementoEstilo.textContent = estilos;
  document.head.appendChild(elementoEstilo);

  // Función para reordenar los campos
  function reordenarCampos() {
    const camposFacturacion = document.querySelector(
      ".woocommerce-billing-fields__field-wrapper",
    );
    const camposEnvio = document.querySelector(
      ".woocommerce-shipping-fields__field-wrapper",
    );

    function moverRegionAntesCiudad(contenedor) {
      if (contenedor) {
        const campoRegion = contenedor
          .querySelector("#billing_state, #shipping_state")
          .closest(".form-row");
        const campoCiudad = contenedor
          .querySelector("#billing_city, #shipping_city")
          .closest(".form-row");

        if (campoRegion && campoCiudad) {
          contenedor.insertBefore(campoRegion, campoCiudad);
        }
      }
    }

    moverRegionAntesCiudad(camposFacturacion);
    moverRegionAntesCiudad(camposEnvio);
  }

  // Llamar a la función para reordenar los campos
  reordenarCampos();

  document.addEventListener("change", async function (evento) {
    if (
      evento.target &&
      (evento.target.id === "billing-state" ||
        evento.target.id === "shipping-state")
    ) {
      console.log("El campo state cambió a:", evento.target.value);
      await obtenerCodigoRegion(evento.target.value);
      limpiarValoresEnvio();
    }
  });

  async function obtenerCodigoRegion(codigoRegion) {
    const url = `https://jellyfish-app-h786r.ondigitalocean.app/api/chilexpress/destinations/${codigoRegion}`;

    try {
      const respuesta = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!respuesta.ok) {
        throw new Error(`¡Error HTTP! estado: ${respuesta.status}`);
      }

      const datos = await respuesta.json();

      const ciudades = Array.isArray(datos)
        ? datos.map((d) => ({
            valor: d.countyCode,
            texto: d.coverageName,
          }))
        : [{ valor: datos.countyCode, texto: datos.coverageName }];

      [
        "billing_city",
        "shipping_city",
        "billing-city",
        "shipping-city",
      ].forEach((id) => {
        const elementoInput = document.getElementById(id);
        if (elementoInput && elementoInput.tagName === "INPUT") {
          actualizarSelect(elementoInput, ciudades);
        }
      });
    } catch (error) {
      console.error("Error al obtener las ciudades:", error);
    }
  }

  function actualizarSelect(elementoInput, ciudades) {
    let select = elementoInput.nextElementSibling;

    if (!select || select.tagName !== "SELECT") {
      select = document.createElement("select");
      select.id = elementoInput.id + "_select";
      select.name = elementoInput.name;
      select.className =
        elementoInput.className +
        " wc-blocks-components-select wc-blocks-components-select__select select2-hidden-accessible";
      select.required = elementoInput.required;

      elementoInput.parentNode.insertBefore(select, elementoInput.nextSibling);
      elementoInput.style.display = "none";

      if (typeof jQuery !== "undefined" && jQuery.fn.select2) {
        jQuery(select).select2();
      }
    }

    const etiqueta = elementoInput.parentNode.querySelector(
      `label[for="${elementoInput.id}"]`,
    );
    if (etiqueta) {
      etiqueta.remove();
    }

    select.innerHTML = '<option value="">Seleccionar Ciudad</option>';

    ciudades.forEach((ciudad) => {
      // Excluir ciudades que contienen un guion
      if (!ciudad.texto.includes("-")) {
        const opcion = document.createElement("option");
        opcion.value = ciudad.valor;
        opcion.textContent = ciudad.texto;
        select.appendChild(opcion);
      }
    });

    select.addEventListener("change", async function () {
      elementoInput.value = this.value;
      elementoInput.dispatchEvent(new Event("change", { bubbles: true }));
      limpiarValoresEnvio();

      let listaEncabezados = {
        Accept: "*/*",
        "User-Agent": "Thunder Client (https://www.thunderclient.com)",
        "Content-Type": "application/json",
      };

      // Obtener el origen de la tienda
      let originCountyCode = await obtenerOrigenTienda();

      // Obtener dimensiones y peso del producto
      let productDimensions = await obtenerDimensionesProducto();

      let contenidoCuerpo = JSON.stringify({
        originCountyCode: originCountyCode,
        destinationCountyCode: elementoInput.value,
        package: {
          weight: productDimensions.weight || "16",
          height: productDimensions.height || "1",
          width: productDimensions.width || "1",
          length: productDimensions.length || "1",
        },
        productType: 3,
        contentType: 1,
        declaredWorth: "2333",
        deliveryTime: 0,
      });
      await obtenerDatosEnvio(contenidoCuerpo, listaEncabezados);
    });
  }

  // Función para obtener el origen de la tienda
  async function obtenerOrigenTienda() {
    try {
      const response = await fetch(
        "/wp-json/wc/v3/settings/general/woocommerce_store_city",
        {
          headers: {
            "X-WP-Nonce": wpApiSettings.nonce,
          },
        },
      );
      const data = await response.json();
      return data.value || "STGO"; // Si no se puede obtener, usa "STGO" como valor por defecto
    } catch (error) {
      console.error("Error al obtener el origen de la tienda:", error);
      return "STGO"; // Valor por defecto en caso de error
    }
  }

  // Función para obtener dimensiones y peso del producto
  async function obtenerDimensionesProducto() {
    try {
      // Suponiendo que tienes acceso al ID del producto actual
      const productId = obtenerIdProductoActual(); // Debes implementar esta función
      const response = await fetch(`/wp-json/wc/v3/products/${productId}`, {
        headers: {
          "X-WP-Nonce": wpApiSettings.nonce,
        },
      });
      const product = await response.json();
      return {
        weight: product.weight || "",
        height: product.dimensions.height || "",
        width: product.dimensions.width || "",
        length: product.dimensions.length || "",
      };
    } catch (error) {
      console.error("Error al obtener dimensiones del producto:", error);
      return {}; // Objeto vacío en caso de error
    }
  }

  // Función para obtener el ID del producto actual (debes implementarla según tu lógica de tienda)
  function obtenerIdProductoActual() {
    // Implementa la lógica para obtener el ID del producto actual
    // Esto podría ser a través de un atributo data en el HTML, una variable global, etc.
    return /* ID del producto */;
  }

  function limpiarValoresEnvio() {
    const chilexpressContainer = document.getElementById(
      "chilexpress-resultado",
    );
    const bluexpressContainer = document.getElementById("bluexpress-resultado");
    const totalElement = document.querySelector(
      ".wc-block-components-totals-footer-item .wc-block-components-totals-item__value",
    );

    if (chilexpressContainer) {
      const chilexpressValueElement = chilexpressContainer.querySelector(
        ".wc-block-components-totals-item__value",
      );
      const chilexpressRadio =
        chilexpressContainer.querySelector("#chilexpress-radio");
      if (chilexpressValueElement) chilexpressValueElement.textContent = "";
      if (chilexpressRadio) chilexpressRadio.checked = false;
    }

    if (bluexpressContainer) {
      const bluexpressValueElement = bluexpressContainer.querySelector(
        ".wc-block-components-totals-item__value",
      );
      const bluexpressRadio =
        bluexpressContainer.querySelector("#bluexpress-radio");
      if (bluexpressValueElement) bluexpressValueElement.textContent = "";
      if (bluexpressRadio) bluexpressRadio.checked = false;
    }

    if (totalElement && subtotalOriginal !== 0) {
      totalElement.textContent = new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        minimumFractionDigits: 0,
      }).format(subtotalOriginal);
    }
  }

  function actualizarTotalConEnvio(valorChilexpress) {
    console.log(
      "Iniciando actualizarTotalConEnvio con valor Chilexpress:",
      valorChilexpress,
    );

    const subtotalElement = document.querySelector(
      ".wc-block-components-totals-item__value",
    );
    const totalElement = document.querySelector(
      ".wc-block-components-totals-footer-item .wc-block-components-totals-item__value",
    );
    const resumenPedido = document.querySelector(
      ".wc-block-components-totals-wrapper",
    );

    if (subtotalElement && totalElement && resumenPedido) {
      function parsearValorChileno(valor) {
        return parseFloat(valor.replace(/[^\d,-]/g, "").replace(",", "."));
      }

      function obtenerSubtotalOriginal() {
        if (subtotalOriginal === 0) {
          const subtotalText = subtotalElement.textContent;
          console.log("Subtotal text original:", subtotalText);
          subtotalOriginal = parsearValorChileno(subtotalText);
          console.log("Subtotal original parseado:", subtotalOriginal);
        }
        return subtotalOriginal;
      }

      let subtotalActual = obtenerSubtotalOriginal();
      console.log("Subtotal actual:", subtotalActual);

      let nuevoTotal = subtotalActual;

      function formatearTotal(total) {
        return new Intl.NumberFormat("es-CL", {
          style: "currency",
          currency: "CLP",
          minimumFractionDigits: 0,
        }).format(total);
      }

      // Crear o actualizar el elemento de Chilexpress
      let chilexpressContainer = document.getElementById(
        "chilexpress-resultado",
      );
      if (!chilexpressContainer) {
        chilexpressContainer = crearElementoEnvio(
          "chilexpress",
          "Chilexpress",
          "https://dx23yqi1tewca.cloudfront.net/images/poiLogo/ba118b9f-b796-4009-9bfc-b1ad28b83a7d.jpg",
        );
        const subtotalContainer = subtotalElement.closest(
          ".wc-block-components-totals-item",
        );
        if (subtotalContainer && subtotalContainer.parentNode) {
          subtotalContainer.parentNode.insertBefore(
            chilexpressContainer,
            subtotalContainer,
          );
        } else {
          resumenPedido.insertBefore(
            chilexpressContainer,
            resumenPedido.firstChild,
          );
        }
      }

      // Crear o actualizar el elemento de Bluexpress
      let bluexpressContainer = document.getElementById("bluexpress-resultado");
      if (!bluexpressContainer) {
        bluexpressContainer = crearElementoEnvio(
          "bluexpress",
          "Bluexpress",
          "https://dojiw2m9tvv09.cloudfront.net/16157/4/article/9/logo-bluexpress6109.jpg",
        );
        chilexpressContainer.parentNode.insertBefore(
          bluexpressContainer,
          chilexpressContainer.nextSibling,
        );
      }

      const chilexpressValueElement = chilexpressContainer.querySelector(
        ".wc-block-components-totals-item__value",
      );
      const chilexpressRadio =
        chilexpressContainer.querySelector("#chilexpress-radio");
      const bluexpressValueElement = bluexpressContainer.querySelector(
        ".wc-block-components-totals-item__value",
      );
      const bluexpressRadio =
        bluexpressContainer.querySelector("#bluexpress-radio");

      if (
        chilexpressValueElement &&
        chilexpressRadio &&
        bluexpressValueElement &&
        bluexpressRadio
      ) {
        chilexpressValueElement.textContent = formatearTotal(valorChilexpress);
        bluexpressValueElement.textContent = formatearTotal(7000); // Valor fijo para Bluexpress

        function actualizarTotal() {
          if (chilexpressRadio.checked) {
            nuevoTotal = subtotalActual + valorChilexpress;
            bluexpressRadio.checked = false;
          } else if (bluexpressRadio.checked) {
            nuevoTotal = subtotalActual + 7000;
            chilexpressRadio.checked = false;
          } else {
            nuevoTotal = subtotalActual;
          }
          console.log("Nuevo total calculado:", nuevoTotal);
          totalElement.textContent = formatearTotal(nuevoTotal);
        }

        chilexpressRadio.addEventListener("change", actualizarTotal);
        bluexpressRadio.addEventListener("change", actualizarTotal);

        actualizarTotal();
      } else {
        console.error(
          "No se pudieron encontrar los elementos necesarios para Chilexpress o Bluexpress",
        );
      }

      console.log(
        "Elementos de envío actualizados:",
        chilexpressContainer.outerHTML,
        bluexpressContainer.outerHTML,
      );
    } else {
      console.error("No se encontraron los elementos necesarios.");
      console.log(
        "Estructura HTML del resumen del pedido:",
        resumenPedido ? resumenPedido.outerHTML : "No encontrado",
      );
    }
  }

  function crearElementoEnvio(id, nombre, logoUrl) {
    const container = document.createElement("div");
    container.id = `${id}-resultado`;
    container.className = "wc-block-components-totals-item";
    container.innerHTML = `
      <span class="wc-block-components-totals-item__label">
        <img src="${logoUrl}" alt="${nombre}" class="${id}-logo" style="width: 140px; height: auto; vertical-align: middle;">
      </span>
      <span class="wc-block-formatted-money-amount wc-block-components-formatted-money-amount wc-block-components-totals-item__value"></span>
      <input type="radio" id="${id}-radio" name="shipping_method" value="${id}">
    `;
    container.style.marginBottom = "10px";
    container.style.padding = "5px 0";
    return container;
  }

  async function obtenerDatosEnvio(contenidoCuerpo, listaEncabezados) {
    try {
      let respuesta = await fetch(
        "https://jellyfish-app-h786r.ondigitalocean.app/api/chilexpress/calculate-shipment",
        {
          method: "POST",
          body: contenidoCuerpo,
          headers: listaEncabezados,
        },
      );

      if (!respuesta.ok) {
        throw new Error(`¡Error HTTP! Estado: ${respuesta.status}`);
      }

      let respuestaJson = await respuesta.json();
      if (
        respuestaJson.data &&
        respuestaJson.data.courierServiceOptions &&
        respuestaJson.data.courierServiceOptions.length > 0
      ) {
        const valorChilexpress = parseInt(
          respuestaJson.data.courierServiceOptions[0].serviceValue,
        );
        actualizarTotalConEnvio(valorChilexpress);
      } else {
        console.error("No se encontraron opciones de servicio de Chilexpress");
        limpiarValoresEnvio();
      }
    } catch (error) {
      console.error("Error al realizar la solicitud:", error);
      limpiarValoresEnvio();
    }
  }

  // Agregar listener para cambios en la selección de ciudad
  document.addEventListener("change", function (event) {
    if (event.target.id.includes("city")) {
      console.log("Ciudad seleccionada, actualizando total...");
      // La actualización del total se manejará en obtenerDatosEnvio
    }
  });
});
