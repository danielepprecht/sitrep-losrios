// ==========================================================================
// core/lifecycle.js — Ciclo de vida de SITREPs y orquestación de renders
// ==========================================================================

// ============================================================
// CICLO DE VIDA
// ============================================================
/**
 * Punto de entrada real al cargar la página. No inicia la app directamente:
 * espera el estado de autenticación (ver services/auth.js). Si hay sesión
 * válida, init() se invoca desde onAuthStateChanged una vez cargado el
 * perfil del usuario.
 */
function boot() {
  watchAuthState();
}

function init() {
  loadFromStorage();
  renderSitrepList();

  // Cargar el último editado o crear uno nuevo
  const ids = Object.keys(state.sitreps);
  if (state.currentId && state.sitreps[state.currentId]) {
    loadSitrep(state.currentId);
  } else if (ids.length > 0) {
    loadSitrep(ids[ids.length - 1]);
  } else {
    createNewSitrep();
  }

  initMap();
  setupAutosave();
}

function createNewSitrep() {
  const id = getNextSitrepNumber();
  state.sitreps[id] = emptySitrep(id);
  state.currentId = id;
  saveToStorage();
  renderSitrepList();
  renderCurrentSitrep();
  showToast(`Reporte ${id} creado`, 'success');
}

function loadSitrep(id) {
  if (!state.sitreps[id]) return;
  state.currentId = id;
  saveToStorage();
  renderSitrepList();
  renderCurrentSitrep();
  closeSitrepsModal();
}

function deleteSitrep(id) {
  showModal({
    title: 'Eliminar reporte',
    message: `¿Eliminar definitivamente ${id}? Esta acción no se puede deshacer.`,
    confirmText: 'Eliminar',
    onConfirm: () => {
      delete state.sitreps[id];
      if (state.currentId === id) {
        const remaining = Object.keys(state.sitreps);
        state.currentId = remaining.length > 0 ? remaining[remaining.length - 1] : null;
        if (!state.currentId) createNewSitrep();
        else renderCurrentSitrep();
      }
      saveToStorage();
      renderSitrepList();
      showToast(`Reporte ${id} eliminado`, 'success');
    }
  });
}

function getCurrent() {
  return state.sitreps[state.currentId];
}

function saveSitrep(showFeedback = false) {
  const current = getCurrent();
  if (current) {
    current.updatedAt = new Date().toISOString();
    saveToStorage();
    renderSitrepList();
    if (showFeedback) showToast('Reporte guardado', 'success');
  }
}

let autosaveTimer;
function setupAutosave() {
  document.addEventListener('input', () => {
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => saveSitrep(false), 600);
  });
}

// ============================================================
// RENDERIZADO: LISTA DE SITREPs
// ============================================================
function renderSitrepList() {
  const list = document.getElementById('sitrep-list');
  const ids = Object.keys(state.sitreps).sort().reverse();
  document.getElementById('sitrep-count').textContent = ids.length;

  if (ids.length === 0) {
    list.innerHTML = '<div class="empty-state">No hay reportes guardados</div>';
    return;
  }

  list.innerHTML = ids.map(id => {
    const s = state.sitreps[id];
    const event = s.identificacion.nombreEvento || 'Sin nombre';
    const isActive = id === state.currentId;
    return `
      <div class="sitrep-item ${isActive ? 'active' : ''}" onclick="loadSitrep('${id}')">
        <div style="flex: 1; min-width: 0;">
          <div class="sitrep-item-id">${id}</div>
          <div class="sitrep-item-meta">${escapeHtml(event)}</div>
        </div>
        <div class="sitrep-item-actions">
          <button class="sitrep-item-pdf" onclick="event.stopPropagation(); generatePDF('${id}')" title="Descargar PDF">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><polyline points="9 15 12 18 15 15"></polyline></svg>
          </button>
          <button class="sitrep-item-delete" onclick="event.stopPropagation(); deleteSitrep('${id}')" title="Eliminar">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================================
// MODAL "MIS SITREP"
// ============================================================
function openSitrepsModal() {
  renderSitrepList();
  document.getElementById('sitreps-modal').classList.add('visible');
}

function closeSitrepsModal() {
  document.getElementById('sitreps-modal')?.classList.remove('visible');
}

function scrollToSection(id) {
  const el = document.getElementById('section-' + id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (!el.classList.contains('expanded')) toggleSection(id);
  }
}

function toggleSection(id) {
  document.getElementById('section-' + id)?.classList.toggle('expanded');
}

// ============================================================
// RENDERIZADO: SITREP COMPLETO
// ============================================================
function renderCurrentSitrep() {
  const s = getCurrent();
  if (!s) return;

  // Sincronizar consolidación de fuentes antes de renderizar
  s.identificacion.fuentesPrincipales = getConsolidatedFuentes(s).join(', ');

  document.getElementById('sitrep-id-display').textContent = s.id;
  document.getElementById('status-text').textContent = s.status;

  const container = document.getElementById('sections-container');
  container.innerHTML = SECTIONS.map(sec => `
    <div class="section-card expanded" id="section-${sec.id}">
      <div class="section-header" onclick="toggleSection('${sec.id}')">
        <span class="section-num">${sec.num}.</span>
        <span class="section-title">${sec.title}</span>
        <span class="section-status" id="status-${sec.id}"></span>
        <span class="section-toggle">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </span>
      </div>
      <div class="section-body">${renderSection(sec.id, s)}</div>
    </div>
  `).join('');

  attachListeners();
  updateProgress();
  renderMarkers();
}

function renderSection(id, s) {
  switch (id) {
    case 'identificacion':  return renderIdentificacion(s);
    case 'resumen':         return renderResumen(s);
    case 'situacion':       return renderSituacion(s);
    case 'afectacion':      return renderAfectacion(s);
    case 'servicios':       return renderServicios(s);
    case 'acciones':        return renderAcciones(s);
    case 'brechas':         return renderBrechas(s);
    case 'prioridades':     return renderPrioridades(s);
    case 'proximas':        return renderProximas(s);
    case 'fuentes':         return renderFuentes(s);
    case 'observaciones':   return renderObservaciones(s);
    case 'distribucion':    return renderDistribucion(s);
    case 'validacion':      return renderValidacion(s);
    default: return '';
  }
}

