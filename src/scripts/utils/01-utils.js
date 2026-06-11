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
document.addEventListener('DOMContentLoaded', init);

