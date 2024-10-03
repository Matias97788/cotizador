// document.addEventListener('DOMContentLoaded', function() {
//     function cambiarCampoACiudad() {
//         const regionCode = 'RM'; // Código de región

//         const url = `https://jellyfish-app-h786r.ondigitalocean.app/api/chilexpress/destinations/${regionCode}`;

//         fetch(url, {
//             method: 'GET',
//             headers: {
//                 'Content-Type': 'application/json',
//             }
//         })
//         .then(response => response.json())
//         .then(data => {
  

//             if (Array.isArray(data)) {
//                 for (let i = 0; i < data.length; i++) {
//                     console.log(`Datos ${i}:`, data[i].coverageName);
//                 }
//             } else {
//                 console.log("Los datos no son un array, es un objeto:", data);
//             }
//             const ciudades = Array.isArray(data) ? data.map(d => ({
//                 value: d.countyCode, // Usar el countyCode como valor
//                 text: d.coverageName // Usar el countyName como texto
//             })) : [
//                 {
//                     value: data.countyCode, // Usar el countyCode como valor
//                     text: data.coverageName // Usar el countyName como texto
//                 }
//             ];

//             function crearSelect(inputElement) {
//                 const select = document.createElement('select');
//                 select.id = inputElement.id;
//                 select.name = inputElement.name;
//                 select.className = inputElement.className + 'wc-blocks-components-select wc-blocks-components-select__select ';
//                 select.required = inputElement.required;

//                 // Añadir las opciones al select
//                 ciudades.forEach(ciudad => {
//                     const option = document.createElement('option');
//                     option.value = ciudad.value;
//                     option.textContent = ciudad.text;
//                     select.appendChild(option);
//                 });

//                 inputElement.parentNode.insertBefore(select, inputElement);
//                 inputElement.style.display = 'none';

//                 const label = inputElement.parentNode.querySelector(`label[for="${inputElement.id}"]`);
//                 if (label) {
//                     label.remove();
//                 }

//                 select.addEventListener('change', function() {
//                     inputElement.value = this.value;
//                     const event = new Event('change', { bubbles: true });
//                     inputElement.dispatchEvent(event);
//                 });
//             }

//             // Aplicar a los campos de ciudad de facturación y envío
//             ['billing_city', 'shipping_city', 'billing-city', 'shipping-city'].forEach(id => {
//                 const inputElement = document.getElementById(id);
//                 if (inputElement && inputElement.tagName === 'INPUT') {
//                     crearSelect(inputElement);
//                 }
//             });
//         })
//         .catch(error => {
//             console.error('Error al obtener las ciudades:', error);
//         });
//     }

//     // Ejecutar la función inmediatamente al cargar el DOM
//     cambiarCampoACiudad();

//     // Eliminar el MutationObserver si no es necesario
//     // Si deseas seguir observando cambios en el DOM, mantenlo; si no, puedes eliminarlo.
//     // const observer = new MutationObserver((mutationsList) => {
//     //     for (const mutation of mutationsList) {
//     //         if (mutation.type === 'childList') {
//     //             cambiarCampoACiudad();
//     //         }
//     //     }
//     // });
//     // observer.observe(document.body, { childList: true, subtree: true });

//     // Opcional: desconectar el observador después de un tiempo si se usa
//     // setTimeout(() => observer.disconnect(), 10000); // Desconecta después de 10 segundos
// });
