// ==========================================================================
// utils/index.js — Utilidades: escape, format, toast, modal
// ==========================================================================

// ============================================================
// UTILIDADES
// ============================================================
function setByPath(obj, path, value) {
  const keys = path.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(str) {
  return escapeHtml(str);
}

// ============================================================
// RUT (Chile): validación y formateo
// ============================================================
/**
 * Valida un RUT chileno con dígito verificador (módulo 11).
 * Acepta formatos con o sin puntos/guión, ej: "12.345.678-5" o "123456785".
 */
function validarRut(rut) {
  if (!rut) return false;
  const limpio = String(rut).replace(/[^0-9kK]/g, '').toUpperCase();
  if (limpio.length < 2) return false;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  if (!/^\d+$/.test(cuerpo)) return false;

  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i], 10) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  const resto = 11 - (suma % 11);
  const dvEsperado = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto);
  return dv === dvEsperado;
}

/**
 * Formatea un RUT a "XX.XXX.XXX-X".
 */
function formatearRut(rut) {
  if (!rut) return '';
  const limpio = String(rut).replace(/[^0-9kK]/g, '').toUpperCase();
  if (limpio.length < 2) return limpio;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  let cuerpoFormateado = '';
  for (let i = 0; i < cuerpo.length; i++) {
    if (i > 0 && (cuerpo.length - i) % 3 === 0) cuerpoFormateado += '.';
    cuerpoFormateado += cuerpo[i];
  }
  return `${cuerpoFormateado}-${dv}`;
}

function formatComunasForDisplay(comunas) {
  if (!Array.isArray(comunas) || comunas.length === 0) {
    return '<span class="pdf-empty">—</span>';
  }
  if (comunas.length === COMUNAS.length) {
    return '<strong style="background: #1F3864; color: #fff; padding: 2px 8px; border-radius: 10px; font-size: 9pt; letter-spacing: 0.04em;">REGIONAL</strong>';
  }
  return escapeHtml(comunas.join(', '));
}

// ============================================================
// TOAST & MODAL
// ============================================================
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  document.getElementById('toast-message').textContent = message;
  toast.className = 'toast ' + type;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 2400);
}

function showModal({ title, message, confirmText, onConfirm }) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-message').textContent = message;
  const confirmBtn = document.getElementById('modal-confirm');
  confirmBtn.textContent = confirmText || 'Confirmar';
  confirmBtn.onclick = () => { closeModal(); onConfirm && onConfirm(); };
  document.getElementById('modal').classList.add('visible');
}

function closeModal() {
  document.getElementById('modal').classList.remove('visible');
}

// Cerrar modal con clic fuera
document.getElementById('modal').addEventListener('click', (e) => {
  if (e.target.id === 'modal') closeModal();
});

// ============================================================
// INICIO
// ============================================================
document.addEventListener('DOMContentLoaded', boot);

