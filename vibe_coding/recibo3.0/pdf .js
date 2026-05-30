/**
 * script.js — Green & Blue Aquamarine · Sistema de Recibos v3.0
 * ─────────────────────────────────────────────────────────────────
 * Funcionalidades:
 *  1. Numeración automática con localStorage
 *  2. Autoguardado con debounce
 *  3. Restauración de datos al recargar
 *  4. Navegación con Enter y flechas del teclado
 *  5. Formato moneda colombiana (separadores de miles con puntos)
 *  6. Suma automática en tiempo real
 *  7. Exportación a PDF (con clonado del DOM para fidelidad visual)
 *  8. Modal de confirmación + Toast de notificaciones
 *  9. Resaltado de campo activo + selección automática al enfocar
 */
 
'use strict';
 
/* =================================================================
   1. CONSTANTES Y CONFIGURACIÓN
   ================================================================= */
 
const LS_KEY          = 'gb_receipt_data';   // Clave en localStorage para los datos del formulario
const LS_NUM_KEY      = 'gb_receipt_number'; // Clave del número de recibo
const RECEIPT_START   = 480;                 // Número inicial si no hay guardado previo
const SAVE_DEBOUNCE   = 600;                 // ms de espera antes de guardar (evita escrituras excesivas)
const TABLE_ROWS      = 5;                   // Filas de la tabla de descripción
const TABLE_COLS      = 2;                   // Columnas (0=descripción, 1=valor)
 
/* =================================================================
   2. REFERENCIAS AL DOM (cacheadas para eficiencia)
   ================================================================= */
 
const dom = {
  receiptNumber : document.getElementById('receiptNumber'),
  totalFinal    : document.getElementById('totalFinal'),
  saveDot       : document.getElementById('saveDot'),
  saveText      : document.getElementById('saveText'),
  btnPDF        : document.getElementById('btnPDF'),
  btnNuevo      : document.getElementById('btnNuevo'),
  modalOverlay  : document.getElementById('modalOverlay'),
  modalConfirmar: document.getElementById('modalConfirmar'),
  modalCancelar : document.getElementById('modalCancelar'),
  receiptCard   : document.getElementById('receiptCard'),
  toast         : document.getElementById('toast'),
};
 
/* =================================================================
   3. ESTADO INTERNO
   ================================================================= */
 
let saveTimer = null;  // Referencia al timeout del debounce de autoguardado
let toastTimer = null; // Referencia al timeout para ocultar el toast
 
/* =================================================================
   4. UTILIDADES GENERALES
   ================================================================= */
 
/**
 * Formatea un número con puntos como separadores de miles (formato colombiano).
 * Ejemplo: 1250000 → "1.250.000"
 * @param {string|number} value
 * @returns {string}
 */
function formatCOP(value) {
  // Convierte a string, elimina todo excepto dígitos
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return '';
  // Inserta punto cada 3 dígitos desde la derecha
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
 
/**
 * Elimina los separadores de miles y retorna el valor numérico.
 * @param {string} formatted  Ej: "1.250.000"
 * @returns {number}
 */
function parseCOP(formatted) {
  const clean = String(formatted).replace(/\./g, '').replace(/\D/g, '');
  return clean ? parseInt(clean, 10) : 0;
}
 
/**
 * Rellena con ceros a la izquierda hasta alcanzar la longitud indicada.
 * @param {number} num
 * @param {number} length
 * @returns {string}
 */
function zeroPad(num, length = 4) {
  return String(num).padStart(length, '0');
}
 
/* =================================================================
   5. TOAST DE NOTIFICACIONES
   ================================================================= */
 
/**
 * Muestra una notificación temporal tipo toast.
 * @param {string} message   Texto a mostrar
 * @param {'success'|'error'|'info'} type  Tipo visual
 * @param {number} duration  Milisegundos que permanece visible
 */
function showToast(message, type = 'success', duration = 2800) {
  const t = dom.toast;
  // Limpia cualquier toast activo
  clearTimeout(toastTimer);
  t.className = `toast toast--${type}`;
  t.textContent = message;
  // Fuerza reflow para reiniciar la transición CSS
  void t.offsetWidth;
  t.classList.add('show');
  toastTimer = setTimeout(() => t.classList.remove('show'), duration);
}
 
/* =================================================================
   6. INDICADOR DE AUTOGUARDADO
   ================================================================= */
 
function setSavingState() {
  dom.saveDot.className = 'save-dot saving';
  dom.saveText.textContent = 'Guardando…';
}
 
function setSavedState() {
  dom.saveDot.className = 'save-dot saved';
  dom.saveText.textContent = 'Guardado';
}
 
function setErrorState() {
  dom.saveDot.className = 'save-dot error';
  dom.saveText.textContent = 'Error al guardar';
}
 
/* =================================================================
   7. NÚMERO DE RECIBO
   ================================================================= */
 
/**
 * Lee el número de recibo desde localStorage y lo muestra.
 * Si no existe, usa RECEIPT_START.
 */
function loadReceiptNumber() {
  const saved = localStorage.getItem(LS_NUM_KEY);
  const num   = saved !== null ? parseInt(saved, 10) : RECEIPT_START;
  dom.receiptNumber.textContent = zeroPad(num);
}
 
/**
 * Incrementa el número de recibo, lo guarda y actualiza el DOM.
 * @returns {string} Nuevo número formateado
 */
function incrementReceiptNumber() {
  const current = parseInt(dom.receiptNumber.textContent, 10);
  const next    = current + 1;
  localStorage.setItem(LS_NUM_KEY, next);
  dom.receiptNumber.textContent = zeroPad(next);
  return zeroPad(next);
}
 
/* =================================================================
   8. AUTOGUARDADO CON localStorage
   ================================================================= */
 
/**
 * Recoge todos los campos con data-save y los persiste en localStorage.
 */
function saveData() {
  try {
    const data = {};
 
    // Inputs de texto y textarea
    document.querySelectorAll('[data-save]:not([type="checkbox"])').forEach(el => {
      data[el.dataset.save] = el.value;
    });
 
    // Checkboxes — guardamos booleano
    document.querySelectorAll('[data-save][type="checkbox"]').forEach(el => {
      data[el.dataset.save] = el.checked;
    });
 
    localStorage.setItem(LS_KEY, JSON.stringify(data));
    setSavedState();
  } catch (err) {
    setErrorState();
    console.error('Error al guardar:', err);
  }
}
 
/**
 * Restaura los datos guardados al cargar la página.
 */
function loadData() {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return;
 
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return; // JSON corrupto — ignorar
  }
 
  // Restaurar inputs de texto y textarea
  document.querySelectorAll('[data-save]:not([type="checkbox"])').forEach(el => {
    if (data[el.dataset.save] !== undefined) {
      el.value = data[el.dataset.save];
    }
  });
 
  // Restaurar checkboxes
  document.querySelectorAll('[data-save][type="checkbox"]').forEach(el => {
    if (data[el.dataset.save] !== undefined) {
      el.checked = Boolean(data[el.dataset.save]);
    }
  });
 
  // Recalcular total con los datos restaurados
  recalculateTotal();
}
 
/**
 * Activa el autoguardado con debounce: espera SAVE_DEBOUNCE ms
 * después de la última tecla antes de persistir.
 */
function triggerAutoSave() {
  setSavingState();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveData, SAVE_DEBOUNCE);
}
 
/* =================================================================
   9. FORMATO MONEDA EN INPUTS DE VALOR
   ================================================================= */
 
/**
 * Maneja el evento 'input' en los campos de VR. TOTAL:
 * - Elimina caracteres no numéricos
 * - Aplica formato con puntos de miles
 * - Dispara el recálculo del total
 * @param {InputEvent} e
 */
function handleCurrencyInput(e) {
  const input = e.target;
 
  // Guarda la posición del cursor antes de reformatear
  const cursorPos = input.selectionStart;
  const oldLen    = input.value.length;
 
  // Limpia y formatea
  const raw       = input.value.replace(/\./g, ''); // Quita puntos existentes
  const formatted = formatCOP(raw);
  input.value     = formatted;
 
  // Ajusta el cursor para que no salte al final al insertar puntos
  const newLen    = formatted.length;
  const diff      = newLen - oldLen;
  const newCursor = Math.max(0, cursorPos + diff);
  input.setSelectionRange(newCursor, newCursor);
 
  // Actualiza el total y dispara el autoguardado
  recalculateTotal();
  triggerAutoSave();
}
 
/* =================================================================
   10. CÁLCULO AUTOMÁTICO DEL TOTAL
   ================================================================= */
 
/**
 * Suma todos los campos [data-value-input] con valores válidos
 * y actualiza el campo TOTAL con formato moneda.
 */
function recalculateTotal() {
  let sum = 0;
 
  document.querySelectorAll('[data-value-input]').forEach(input => {
    const val = parseCOP(input.value);
    if (!isNaN(val) && val > 0) sum += val;
  });
 
  // Muestra el resultado formateado (o vacío si no hay valores)
  dom.totalFinal.value = sum > 0 ? formatCOP(sum) : '';
}
 
/* =================================================================
   11. NAVEGACIÓN CON TECLADO
   ================================================================= */
 
/**
 * Construye la lista ordenada de inputs navegables.
 * Usa el atributo data-nav (número entero) para definir el orden.
 * @returns {HTMLElement[]}
 */
function buildNavList() {
  return Array.from(
    document.querySelectorAll(
      '#receiptCard [data-nav]:not([readonly]):not([type="checkbox"])'
    )
  ).sort((a, b) => parseInt(a.dataset.nav) - parseInt(b.dataset.nav));
}
 
/**
 * Dado un input de la tabla, retorna su posición {row, col} y el tbody.
 * Retorna null si el input no está en la tabla.
 * @param {HTMLElement} input
 * @returns {{tbody: HTMLElement, row: number, col: number}|null}
 */
function getTablePosition(input) {
  const cell = input.closest('td');
  if (!cell) return null;
  const row = parseInt(input.dataset.row, 10);
  const col = parseInt(input.dataset.col, 10);
  if (isNaN(row) || isNaN(col)) return null;
  return { tbody: document.getElementById('descTableBody'), row, col };
}
 
/**
 * Devuelve el input de la tabla en la posición {row, col} dada.
 * @param {HTMLElement} tbody
 * @param {number} row
 * @param {number} col
 * @returns {HTMLElement|null}
 */
function getTableInput(tbody, row, col) {
  const tr = tbody.rows[row];
  if (!tr) return null;
  const td = tr.cells[col];
  if (!td) return null;
  return td.querySelector('input') || null;
}
 
/**
 * Manejador central de teclado — adjunto a cada input navegable.
 * Teclas manejadas:
 *  - Enter      → siguiente campo en el orden data-nav
 *  - ArrowDown  → fila siguiente (solo en tabla)
 *  - ArrowUp    → fila anterior  (solo en tabla)
 *  - ArrowRight → columna siguiente (solo en tabla, si no hay texto a la derecha)
 *  - ArrowLeft  → columna anterior  (solo en tabla, si cursor está al inicio)
 * @param {KeyboardEvent} e
 */
function handleKeyDown(e) {
  const input   = e.target;
  const key     = e.key;
  const navList = buildNavList(); // Se reconstruye solo cuando hace falta (≤25 elementos)
  const idx     = navList.indexOf(input);
 
  /* ── Enter → siguiente campo ── */
  if (key === 'Enter') {
    e.preventDefault();
    const next = navList[idx + 1];
    if (next) {
      next.focus();
      // Selecciona el contenido para reemplazar fácilmente
      if (typeof next.select === 'function') next.select();
    }
    // Si es el último campo, no hace nada (sin errores)
    return;
  }
 
  /* ── Flechas en tabla ── */
  const pos = getTablePosition(input);
  if (!pos) return; // No es un input de tabla — dejamos el comportamiento por defecto
 
  const { tbody, row, col } = pos;
  let targetRow = row;
  let targetCol = col;
  let shouldMove = false;
 
  if (key === 'ArrowDown' && row < TABLE_ROWS - 1) {
    e.preventDefault();
    targetRow = row + 1;
    shouldMove = true;
  } else if (key === 'ArrowUp' && row > 0) {
    e.preventDefault();
    targetRow = row - 1;
    shouldMove = true;
  } else if (key === 'ArrowRight' && col < TABLE_COLS - 1) {
    // Solo moverse si el cursor está al final del texto
    const atEnd = input.selectionStart === input.value.length;
    if (atEnd) {
      e.preventDefault();
      targetCol = col + 1;
      shouldMove = true;
    }
  } else if (key === 'ArrowLeft' && col > 0) {
    // Solo moverse si el cursor está al inicio del texto
    const atStart = input.selectionStart === 0;
    if (atStart) {
      e.preventDefault();
      targetCol = col - 1;
      shouldMove = true;
    }
  }
 
  if (shouldMove) {
    const target = getTableInput(tbody, targetRow, targetCol);
    if (target) {
      target.focus();
      if (typeof target.select === 'function') target.select();
    }
  }
}
 
/**
 * Selecciona todo el texto al hacer foco en un input.
 * Mejora la velocidad de edición: el usuario reemplaza sin borrar.
 * @param {FocusEvent} e
 */
function handleFocusSelect(e) {
  const el = e.target;
  // setTimeout necesario en algunos navegadores (especialmente Chrome)
  setTimeout(() => {
    if (typeof el.select === 'function') el.select();
  }, 0);
}
 
/* =================================================================
   12. LIMPIAR FORMULARIO — "Nuevo Recibo"
   ================================================================= */
 
/**
 * Limpia todos los campos del recibo y avanza el número.
 */
function clearForm() {
  // Vaciar todos los inputs (excepto readonly y checkboxes)
  document.querySelectorAll(
    '#receiptCard input:not([readonly]):not([type="checkbox"]), #receiptCard textarea'
  ).forEach(el => { el.value = ''; });
 
  // Desmarcar todos los checkboxes
  document.querySelectorAll('#receiptCard input[type="checkbox"]').forEach(cb => {
    cb.checked = false;
  });
 
  // Avanza el número de recibo
  const newNum = incrementReceiptNumber();
 
  // Limpia el localStorage de datos del formulario (pero mantiene el número)
  localStorage.removeItem(LS_KEY);
  setSavedState();
 
  showToast(`Recibo N° ${newNum} listo ✓`, 'success');
}
 
/* =================================================================
   13. EXPORTACIÓN A PDF
   ================================================================= */
 
/**
 * Genera un PDF del recibo actual usando html2pdf.js.
 *
 * Estrategia: clona el recibo, reemplaza los inputs con spans
 * para que html2canvas los renderice correctamente, genera el PDF
 * desde el clon y lo descarta.
 */
async function exportPDF() {
  /* ── Preparar UI ── */
  dom.btnPDF.disabled = true;
  dom.btnPDF.innerHTML = `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 8v4l3 3"/>
    </svg>
    Generando…
  `;
 
  /* ── Crear el clon del recibo ── */
  const original = dom.receiptCard;
  const clone    = original.cloneNode(true);
 
  // Aplicar estilos base al clon para el render
  clone.style.cssText = `
    position: absolute;
    top: -9999px;
    left: -9999px;
    width: ${original.offsetWidth}px;
    background: #d6ecfb;
    border: 2px solid #6db3e8;
    border-radius: 0;
    box-shadow: none;
    font-family: 'Nunito', sans-serif;
  `;
 
  /* ── Reemplazar inputs con elementos estáticos ── */
  // Esto garantiza que html2canvas renderice el texto correctamente
  clone.querySelectorAll('input:not([type="checkbox"])').forEach(input => {
    const span = document.createElement('span');
    span.textContent = input.value || '';
    // Copiar las clases para que hereden los estilos CSS
    span.className = input.className;
    span.style.cssText = `
      display: block;
      width: 100%;
      min-height: 20px;
      padding: ${input.tagName === 'TEXTAREA' ? '6px 10px' : '3px 8px'};
      font-family: inherit;
      font-size: inherit;
      font-weight: inherit;
      color: inherit;
      text-align: inherit;
      letter-spacing: inherit;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      box-sizing: border-box;
    `;
    input.parentNode.replaceChild(span, input);
  });
 
  // Reemplazar textareas
  clone.querySelectorAll('textarea').forEach(ta => {
    const div = document.createElement('div');
    div.textContent = ta.value || '';
    div.className = ta.className;
    div.style.cssText = `
      padding: 6px 10px;
      font-family: inherit;
      font-size: inherit;
      color: inherit;
      min-height: 55px;
      white-space: pre-wrap;
      word-break: break-word;
    `;
    ta.parentNode.replaceChild(div, ta);
  });
 
  // Reemplazar checkboxes con texto ✓ o ☐
  clone.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    const span = document.createElement('span');
    span.textContent = cb.checked ? '✓' : '☐';
    span.style.cssText = 'display:inline-block; width:13px; height:13px; text-align:center; font-size:11px; margin-right:3px; color: inherit;';
    cb.parentNode.replaceChild(span, cb);
  });
 
  // Añadir el clon al body para que html2canvas pueda renderizarlo
  document.body.appendChild(clone);
 
  /* ── Número del recibo para el nombre del archivo ── */
  const numRecibo = dom.receiptNumber.textContent;
 
  /* ── Opciones de html2pdf ── */
  const options = {
    margin:     [4, 4, 4, 4],  // mm: top, right, bottom, left
    filename:   `recibo-${numRecibo}.pdf`,
    image:      { type: 'jpeg', quality: 0.97 },
    html2canvas: {
      scale:       2.5,          // Resolución alta para nitidez
      useCORS:     true,
      logging:     false,
      letterRendering: true,
      backgroundColor: '#d6ecfb',
    },
    jsPDF: {
      unit:        'mm',
      format:      'a5',         // 148mm × 210mm
      orientation: 'landscape',  // Apaisado: 210mm × 148mm — perfecto para el recibo
    },
    pagebreak: { mode: 'avoid-all' },
  };
 
  try {
    await html2pdf().set(options).from(clone).save();
    showToast(`PDF del recibo ${numRecibo} descargado ✓`, 'success');
  } catch (err) {
    console.error('Error al generar PDF:', err);
    showToast('Error al generar el PDF. Intenta de nuevo.', 'error');
  } finally {
    // Limpiar: remover el clon y restaurar el botón
    document.body.removeChild(clone);
    dom.btnPDF.disabled = false;
    dom.btnPDF.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      Descargar PDF
    `;
  }
}
 
/* =================================================================
   14. MODAL
   ================================================================= */
 
function openModal() {
  dom.modalOverlay.hidden = false;
  // Foco en el botón de cancelar (accesibilidad)
  setTimeout(() => dom.modalCancelar.focus(), 50);
}
 
function closeModal() {
  dom.modalOverlay.hidden = true;
  dom.btnNuevo.focus();
}
 
/* =================================================================
   15. INICIALIZACIÓN DE EVENTOS
   ================================================================= */
 
/**
 * Registra todos los event listeners del sistema.
 * Usa delegación de eventos donde es posible para eficiencia.
 */
function initEvents() {
  const navList = buildNavList(); // Lista inicial
 
  /* ── Navegación con teclado ── */
  // Adjunto a cada input navegable individualmente (necesario para
  // conocer la posición exacta en la tabla con getTablePosition)
  navList.forEach(input => {
    input.addEventListener('keydown', handleKeyDown);
    input.addEventListener('focus',   handleFocusSelect);
  });
 
  /* ── Formato moneda en campos de valor ── */
  document.querySelectorAll('[data-value-input]').forEach(input => {
    input.addEventListener('input', handleCurrencyInput);
  });
 
  /* ── Autoguardado en todos los inputs no monetarios ── */
  // Los monetarios ya tienen su propio handler que llama triggerAutoSave
  document.querySelectorAll(
    '#receiptCard input:not([data-value-input]):not([readonly]):not([type="checkbox"]), ' +
    '#receiptCard textarea'
  ).forEach(el => {
    el.addEventListener('input', triggerAutoSave);
  });
 
  // Checkboxes: usan 'change' en lugar de 'input'
  document.querySelectorAll('#receiptCard input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', triggerAutoSave);
  });
 
  /* ── Botón PDF ── */
  dom.btnPDF.addEventListener('click', exportPDF);
 
  /* ── Botón Nuevo Recibo → abre el modal ── */
  dom.btnNuevo.addEventListener('click', openModal);
 
  /* ── Modal: confirmar ── */
  dom.modalConfirmar.addEventListener('click', () => {
    closeModal();
    clearForm();
  });
 
  /* ── Modal: cancelar ── */
  dom.modalCancelar.addEventListener('click', closeModal);
 
  /* ── Modal: cerrar con Escape ── */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !dom.modalOverlay.hidden) closeModal();
  });
 
  /* ── Modal: cerrar al hacer clic fuera de la tarjeta ── */
  dom.modalOverlay.addEventListener('click', e => {
    if (e.target === dom.modalOverlay) closeModal();
  });
}
 
/* =================================================================
   16. PUNTO DE ENTRADA — DOMContentLoaded
   ================================================================= */
 
document.addEventListener('DOMContentLoaded', () => {
  // 1. Cargar el número de recibo (localStorage o valor inicial)
  loadReceiptNumber();
 
  // 2. Restaurar los datos del formulario si el usuario recargó la página
  loadData();
 
  // 3. Registrar todos los eventos
  initEvents();
 
  // 4. Indicar que no hay cambios pendientes al arrancar
  setSavedState();
 
  console.log('✅ Green & Blue Aquamarine — Sistema de Recibos v3.0 listo.');
});