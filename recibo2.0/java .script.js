/* ============================================
   script.js — Sistema de Recibos
   Green & Blue Aquamarine
   ============================================ */

/* ============================================
   VARIABLES
   ============================================ */

// Contenedor del recibo completo
const receiptCard = document.querySelector(".receipt-card");

// Botones
const downloadBtn = document.getElementById("downloadPdf");
const newReceiptBtn = document.getElementById("newReceipt");

// Número del recibo
const receiptNumber = document.querySelector(".receipt-num");

// Todos los campos
const inputs = document.querySelectorAll("input, textarea");

/* ============================================
   NUMERACIÓN AUTOMÁTICA
   ============================================ */

// Obtener número guardado o iniciar en 480
let currentReceipt = localStorage.getItem("receiptNumber");

if (!currentReceipt) {
  currentReceipt = 480;
  localStorage.setItem("receiptNumber", currentReceipt);
}

// Mostrar número con 4 dígitos
receiptNumber.textContent = String(currentReceipt).padStart(4, "0");

/* ============================================
   AUTOGUARDADO
   ============================================ */

// Guardar datos automáticamente
function saveFormData() {

  const formData = {};

  inputs.forEach((input, index) => {

    // Checkboxes
    if (input.type === "checkbox") {
      formData[index] = input.checked;
    } else {
      formData[index] = input.value;
    }

  });

  localStorage.setItem("receiptFormData", JSON.stringify(formData));
}

// Recuperar datos guardados
function loadFormData() {

  const savedData = localStorage.getItem("receiptFormData");

  if (!savedData) return;

  const formData = JSON.parse(savedData);

  inputs.forEach((input, index) => {

    if (formData[index] !== undefined) {

      if (input.type === "checkbox") {
        input.checked = formData[index];
      } else {
        input.value = formData[index];
      }

    }

  });
}

// Escuchar cambios en inputs
inputs.forEach(input => {
  input.addEventListener("input", saveFormData);
  input.addEventListener("change", saveFormData);
});

// Cargar datos al abrir
loadFormData();

/* ============================================
   DESCARGAR PDF
   ============================================ */

downloadBtn.addEventListener("click", () => {

  // Configuración PDF
  const options = {
    margin: 0.3,
    filename: `recibo-${receiptNumber.textContent}.pdf`,
    image: {
      type: "jpeg",
      quality: 1
    },
    html2canvas: {
      scale: 2
    },
    jsPDF: {
      unit: "in",
      format: "a4",
      orientation: "portrait"
    }
  };

  // Generar PDF
  html2pdf().set(options).from(receiptCard).save();

  // Incrementar número de recibo
  currentReceipt++;

  localStorage.setItem("receiptNumber", currentReceipt);

});

/* ============================================
   NUEVO RECIBO
   ============================================ */

newReceiptBtn.addEventListener("click", () => {

  // Limpiar inputs
  inputs.forEach(input => {

    if (input.type === "checkbox") {
      input.checked = false;
    } else {
      input.value = "";
    }

  });

  // Limpiar localStorage del formulario
  localStorage.removeItem("receiptFormData");

  // Actualizar número
  receiptNumber.textContent = String(currentReceipt).padStart(4, "0");

});

/* ============================================
   MENSAJE DE CONEXIÓN
   ============================================ */

console.log("Sistema de recibos funcionando correctamente");