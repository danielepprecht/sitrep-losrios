// ==========================================================================
// sections/identificacion.js — Punto 1: Identificación del reporte
// Incluye matriz de incidentes y consolidación auto de fuentes
// ==========================================================================

function flyToIncidente(incId) {
  const inc = getIncidente(incId);
  if (!inc || inc.lat == null || !map) return;
  map.flyTo([inc.lat, inc.lng], 14, { duration: 0.6 });
}

// Modo "ubicar manual" para una fila: el siguiente clic en el mapa fija el punto
let manualLocatingIncId = null;

function manualLocateIncidente(incId) {
  manualLocatingIncId = incId;
  const inc = getIncidente(incId);
  if (!inc) return;
  // Centrar en la primera comuna si existe
  if (inc.comunas.length > 0) {
    const c = COMUNAS.find(x => x.name === inc.comunas[0]);
    if (c && map) map.flyTo([c.lat, c.lng], 12, { duration: 0.5 });
  }
  if (map) map.getContainer().style.cursor = 'crosshair';
  showToast(`Haga clic en el mapa para ubicar el incidente #${getCurrent().identificacion.incidentes.findIndex(x => x.id === incId) + 1}`, 'success');
}

// Consolidación automática de fuentes desde la tabla de afectación (Punto 4)
function getConsolidatedFuentes(s) {
  if (!s || !Array.isArray(s.afectacion)) return [];
  const set = new Set();
  s.afectacion.forEach(row => {
    const f = (row.fuente || '').trim();
    if (f) set.add(f);
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
}

function renderFuentesAuto(s) {
  const fuentes = getConsolidatedFuentes(s);
  if (fuentes.length === 0) {
    return `
      <div class="fuentes-auto-empty">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <span>Sin fuentes registradas aún. Las fuentes se consolidarán automáticamente desde la columna <strong>Fuente</strong> del Punto 4 (Afectación territorial).</span>
      </div>
    `;
  }
  return `
    <div class="fuentes-auto-list">
      ${fuentes.map(f => `<span class="fuente-tag">${escapeHtml(f)}</span>`).join('')}
    </div>
    <div class="fuentes-auto-meta">${fuentes.length} fuente${fuentes.length !== 1 ? 's' : ''} consolidada${fuentes.length !== 1 ? 's' : ''}</div>
  `;
}

function refreshFuentesAuto() {
  const s = getCurrent();
  if (!s) return;
  const el = document.getElementById('fuentes-auto-display');
  if (el) el.innerHTML = renderFuentesAuto(s);
  // Mantener sincronizado el campo del modelo para PDF/exportación
  s.identificacion.fuentesPrincipales = getConsolidatedFuentes(s).join(', ');
}

function renderIdentificacion(s) {
  const i = s.identificacion;
  return `
    <div class="section-help">Datos generales para ubicar, fechar y trazar el reporte. El número de SITREP es correlativo y no editable. Registre cada incidente en una fila distinta de la matriz; el sistema georreferencia automáticamente cada uno y lo muestra con un color único en el mapa.</div>

    <div class="field-row cols-2">
      <div class="field">
        <label class="field-label">Tipo de reporte</label>
        <div class="option-group" data-bind-group="identificacion.tipoReporte">
          ${['Preliminar', 'Ampliación', 'Cierre'].map(opt => `
            <label class="option-chip ${i.tipoReporte === opt ? 'selected' : ''}">
              <input type="radio" name="tipoReporte" value="${opt}" ${i.tipoReporte === opt ? 'checked' : ''}>
              ${opt}
            </label>
          `).join('')}
        </div>
      </div>
      <div class="field">
        <label class="field-label">Tipo de amenaza</label>
        <select class="field-select" data-bind="identificacion.tipoAmenaza">
          <option value="">— Seleccionar —</option>
          ${TIPOS_AMENAZA.map(t => `<option value="${t}" ${i.tipoAmenaza === t ? 'selected' : ''}>${t}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="field-row">
      <div class="field">
        <label class="field-label">Nombre del evento <span class="required">*</span></label>
        <input class="field-input" type="text" data-bind="identificacion.nombreEvento" value="${escapeAttr(i.nombreEvento)}" placeholder="Ej: Sistema frontal Región de Los Ríos">
      </div>
    </div>

    <div class="field">
      <label class="field-label" style="display: flex; align-items: center; justify-content: space-between;">
        <span>Matriz de incidentes</span>
        <span style="font-weight: 400; font-size: 11px; color: var(--text-subtle);">Una fila por incidente · georreferenciación automática</span>
      </label>
      <div id="incidentes-matrix">${renderIncidentesMatrix(i.incidentes)}</div>
    </div>

    <div class="field-row cols-3">
      <div class="field">
        <label class="field-label">Período informado: desde</label>
        <input class="field-input" type="datetime-local" data-bind="identificacion.periodoDesde" value="${escapeAttr(i.periodoDesde)}">
      </div>
      <div class="field">
        <label class="field-label">Hasta</label>
        <input class="field-input" type="datetime-local" data-bind="identificacion.periodoHasta" value="${escapeAttr(i.periodoHasta)}">
      </div>
      <div class="field">
        <label class="field-label">Hora de corte de información</label>
        <input class="field-input" type="datetime-local" data-bind="identificacion.horaCorte" value="${escapeAttr(i.horaCorte)}">
      </div>
    </div>

    <div class="field-row cols-2">
      <div class="field">
        <label class="field-label">Fecha y hora de emisión</label>
        <input class="field-input" type="datetime-local" data-bind="identificacion.fechaEmision" value="${escapeAttr(i.fechaEmision)}">
      </div>
      <div class="field">
        <label class="field-label">Próximo SITREP estimado</label>
        <input class="field-input" type="datetime-local" data-bind="identificacion.proximoSitrep" value="${escapeAttr(i.proximoSitrep)}">
      </div>
    </div>

    <div class="field-row cols-2">
      <div class="field">
        <label class="field-label">Responsable de consolidación</label>
        <input class="field-input" type="text" data-bind="identificacion.responsable" value="${escapeAttr(i.responsable)}" placeholder="Equipo / persona responsable">
      </div>
      <div class="field">
        <label class="field-label" style="display: flex; align-items: center; justify-content: space-between;">
          <span>Fuentes principales utilizadas</span>
          <span style="font-weight: 400; font-size: 11px; color: var(--text-subtle); font-style: italic;">consolidación automática desde Punto 4</span>
        </label>
        <div class="fuentes-auto" id="fuentes-auto-display">${renderFuentesAuto(s)}</div>
      </div>
    </div>
  `;
}

// ----------- 2. RESUMEN EJECUTIVO -----------
