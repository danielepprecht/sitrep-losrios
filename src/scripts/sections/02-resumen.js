// ==========================================================================
// sections/resumen.js — Punto 2: Resumen ejecutivo con auto-redacción
// ==========================================================================
// Construye el texto del resumen general consolidando las descripciones por comuna
function buildAutoGeneral(s) {
  const incidentes = (s.identificacion && s.identificacion.incidentes) || [];
  const comunasReportadas = new Set();
  incidentes.forEach(inc => {
    (inc.comunas || []).forEach(c => comunasReportadas.add(c));
  });
  const comunasList = Array.from(comunasReportadas);
  if (comunasList.length === 0) return '';

  // Filtrar comunas que tienen descripción
  const conTexto = comunasList
    .map(c => ({ comuna: c, texto: ((s.resumen.porComuna || {})[c] || '').trim() }))
    .filter(x => x.texto);

  if (conTexto.length === 0) return '';

  // Encabezado contextual
  const nombreEvento = (s.identificacion.nombreEvento || '').trim();
  const tipoAmenaza = (s.identificacion.tipoAmenaza || '').trim();
  let intro = 'Durante el período informado';
  if (nombreEvento) intro += `, en el contexto del evento «${nombreEvento}»`;
  if (tipoAmenaza) intro += ` (amenaza ${tipoAmenaza.toLowerCase()})`;
  const numComunas = conTexto.length;
  intro += `, se registra afectación en ${numComunas} comuna${numComunas !== 1 ? 's' : ''} de la Región de Los Ríos:`;

  // Bloque por comuna en una línea narrativa
  const bloques = conTexto.map(({ comuna, texto }) => {
    // Asegurar que termine con punto
    let t = texto.trim();
    if (!/[.!?]$/.test(t)) t += '.';
    // Capitalizar primera letra del texto
    t = t.charAt(0).toUpperCase() + t.slice(1);
    return `${comuna}: ${t}`;
  });

  return intro + '\n\n' + bloques.join('\n\n');
}

function renderResumen(s) {
  // Recolectar comunas únicas reportadas en los incidentes del punto 1
  const incidentes = (s.identificacion && s.identificacion.incidentes) || [];
  const comunasReportadas = new Set();
  incidentes.forEach(inc => {
    (inc.comunas || []).forEach(c => comunasReportadas.add(c));
  });
  const comunasList = Array.from(comunasReportadas);

  // Sincronizar automáticamente el resumen general si NO ha sido editado manualmente
  if (!s.resumen.generalEditado) {
    const auto = buildAutoGeneral(s);
    if (auto) s.resumen.general = auto;
  }

  let comunasBlocks;
  if (comunasList.length === 0) {
    comunasBlocks = `
      <div style="padding: 14px 16px; background: var(--bg-subtle); border: 1px dashed var(--border-strong); border-radius: var(--radius); text-align: center; color: var(--text-muted); font-size: 12.5px;">
        <strong>Sin comunas registradas en el evento.</strong><br>
        Para que aparezcan ventanas por comuna, registre primero los incidentes en el Punto 1 (Matriz de incidentes) con sus comunas correspondientes.
      </div>
    `;
  } else {
    // Asignar color por comuna usando el primer incidente que la incluye
    const comunaColors = {};
    comunasList.forEach(c => {
      const inc = incidentes.find(x => (x.comunas || []).includes(c));
      comunaColors[c] = inc ? inc.color : '#1F3864';
    });

    comunasBlocks = `
      <div class="resumen-header" style="margin-top: 14px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
        <h4 style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; margin: 0;">Descripción por comuna reportada</h4>
        <span style="font-size: 11px; color: var(--text-subtle);">${comunasList.length} comuna${comunasList.length !== 1 ? 's' : ''} del evento</span>
      </div>
      <div class="comunas-grid">
        ${comunasList.map(c => {
          const color = comunaColors[c];
          const val = (s.resumen.porComuna && s.resumen.porComuna[c]) || '';
          return `
            <div class="comuna-card" style="--c-color: ${color};">
              <div class="comuna-card-header">
                <span class="comuna-card-dot" style="background: ${color};"></span>
                <span class="comuna-card-name">${escapeHtml(c)}</span>
              </div>
              <textarea class="comuna-card-text" rows="4"
                        placeholder="Describa qué está ocurriendo en ${escapeHtml(c)}…"
                        oninput="updateResumenComuna('${escapeAttr(c)}', this.value)">${escapeHtml(val)}</textarea>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // Estado del resumen general: auto-generado o editado manualmente
  const isEdited = !!s.resumen.generalEditado;
  const hasContent = !!(s.resumen.general || '').trim();
  const statusBadge = isEdited
    ? `<span class="resumen-badge resumen-badge-manual" title="Texto editado manualmente. Use «Regenerar» para volver al texto automático.">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        Editado manualmente
      </span>`
    : (hasContent
        ? `<span class="resumen-badge resumen-badge-auto" title="Generado automáticamente desde las descripciones por comuna.">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="13 2 13 9 20 9"></polyline><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-7-7z"></path></svg>
            Auto-generado
          </span>`
        : '');

  return `
    <div class="section-help">Síntesis general del evento más una descripción específica por cada comuna reportada en el Punto 1. <strong>El resumen general se redacta automáticamente</strong> consolidando las descripciones por comuna; puede editarlo libremente si requiere ajustarlo.</div>

    <div class="field">
      <label class="field-label" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
        <span style="display: inline-flex; align-items: center; gap: 8px;">
          <span>Resumen ejecutivo general</span>
          ${statusBadge}
        </span>
        <button type="button" class="resumen-regenerate-btn" onclick="regenerateResumenGeneral()" title="Volver a generar automáticamente el resumen consolidado desde las comunas. Reemplazará el texto actual.">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
          Regenerar desde comunas
        </button>
      </label>
      <textarea id="resumen-general-textarea" class="field-textarea" rows="7" placeholder="Se redactará automáticamente al describir las comunas más abajo. También puede escribirlo manualmente."
                oninput="updateResumenGeneral(this.value)">${escapeHtml(s.resumen.general || '')}</textarea>
    </div>

    ${comunasBlocks}
  `;
}

function updateResumenGeneral(val) {
  const s = getCurrent();
  if (!s) return;
  if (!s.resumen || typeof s.resumen !== 'object') s.resumen = { general: '', porComuna: {}, generalEditado: false };
  s.resumen.general = val;
  // Marcar como editado manualmente solo si difiere del auto-generado actual
  const auto = buildAutoGeneral(s);
  s.resumen.generalEditado = (val.trim() !== '' && val.trim() !== auto.trim());
  saveSitrep();
  // Refrescar el badge sin re-renderizar el textarea (para no perder foco)
  refreshResumenBadge();
  updateProgress();
}

function updateResumenComuna(comuna, val) {
  const s = getCurrent();
  if (!s) return;
  if (!s.resumen || typeof s.resumen !== 'object') s.resumen = { general: '', porComuna: {}, generalEditado: false };
  if (!s.resumen.porComuna) s.resumen.porComuna = {};
  s.resumen.porComuna[comuna] = val;
  // Si el general NO ha sido editado manualmente, regenerarlo en vivo
  if (!s.resumen.generalEditado) {
    s.resumen.general = buildAutoGeneral(s);
    const ta = document.getElementById('resumen-general-textarea');
    if (ta && document.activeElement !== ta) {
      ta.value = s.resumen.general;
    }
  }
  saveSitrep();
  refreshResumenBadge();
  updateProgress();
}

function regenerateResumenGeneral() {
  const s = getCurrent();
  if (!s) return;
  const auto = buildAutoGeneral(s);
  if (!auto) {
    showToast('No hay descripciones por comuna para consolidar', 'error');
    return;
  }
  s.resumen.general = auto;
  s.resumen.generalEditado = false;
  saveSitrep();
  const ta = document.getElementById('resumen-general-textarea');
  if (ta) ta.value = auto;
  refreshResumenBadge();
  showToast('Resumen regenerado desde las comunas', 'success');
  updateProgress();
}

function refreshResumenBadge() {
  // Re-renderiza solo el label del resumen para actualizar el badge,
  // sin tocar el textarea (preserva foco y cursor).
  const s = getCurrent();
  if (!s) return;
  const sec = document.getElementById('section-resumen');
  if (!sec) return;
  const label = sec.querySelector('.field > .field-label');
  if (!label) return;
  const isEdited = !!s.resumen.generalEditado;
  const hasContent = !!(s.resumen.general || '').trim();
  const badge = label.querySelector('.resumen-badge');
  if (badge) badge.remove();
  const span = label.querySelector('span > span:first-child') || label.querySelector('span');
  let newBadgeHtml = '';
  if (isEdited) {
    newBadgeHtml = `<span class="resumen-badge resumen-badge-manual" title="Texto editado manualmente. Use «Regenerar» para volver al texto automático.">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
      Editado manualmente
    </span>`;
  } else if (hasContent) {
    newBadgeHtml = `<span class="resumen-badge resumen-badge-auto" title="Generado automáticamente desde las descripciones por comuna.">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="13 2 13 9 20 9"></polyline><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-7-7z"></path></svg>
      Auto-generado
    </span>`;
  }
  if (newBadgeHtml && span && span.parentElement) {
    span.parentElement.insertAdjacentHTML('beforeend', newBadgeHtml);
  }
}

