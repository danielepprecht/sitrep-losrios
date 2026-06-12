// ==========================================================================
// sections/restantes.js — Puntos 6 a 13: tablas dinámicas y validación
// ==========================================================================
// ----------- 6. ACCIONES EJECUTADAS -----------
function renderAcciones(s) {
  return `
    <div class="section-help">Acciones realizadas durante el período informado por instituciones del Sistema Regional de Protección Civil.</div>
    <div class="data-table-wrap">
      <table class="data-table">
        <thead><tr>
          <th style="width: 24%;">Acción</th>
          <th style="width: 18%;">Institución responsable</th>
          <th style="width: 15%;">Lugar</th>
          <th style="width: 12%;">Estado</th>
          <th style="width: 9%;">Hora</th>
          <th style="width: 22%;">Observación</th>
          <th class="col-action"></th>
        </tr></thead>
        <tbody id="acciones-rows">
          ${s.acciones.map((row, i) => renderAccionRow(row, i)).join('')}
        </tbody>
      </table>
    </div>
    <button class="add-row-btn" onclick="addAccionRow()">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      Agregar acción
    </button>
  `;
}

function renderAccionRow(row, i) {
  return `
    <tr>
      <td><textarea data-table="acciones" data-row="${i}" data-field="accion">${escapeHtml(row.accion || '')}</textarea></td>
      <td><input type="text" data-table="acciones" data-row="${i}" data-field="institucion" value="${escapeAttr(row.institucion || '')}"></td>
      <td><input type="text" data-table="acciones" data-row="${i}" data-field="lugar" value="${escapeAttr(row.lugar || '')}"></td>
      <td>
        <select data-table="acciones" data-row="${i}" data-field="estado">
          <option value="">—</option>
          ${['En ejecución', 'En desarrollo', 'Ejecutada', 'Permanente', 'Pendiente'].map(e => `<option value="${e}" ${row.estado === e ? 'selected' : ''}>${e}</option>`).join('')}
        </select>
      </td>
      <td><input type="time" data-table="acciones" data-row="${i}" data-field="hora" value="${escapeAttr(row.hora || '')}"></td>
      <td><input type="text" data-table="acciones" data-row="${i}" data-field="observacion" value="${escapeAttr(row.observacion || '')}"></td>
      <td class="col-action"><button class="row-delete" onclick="deleteRow('acciones', ${i})">✕</button></td>
    </tr>
  `;
}

function addAccionRow() {
  getCurrent().acciones.push({ accion: '', institucion: '', lugar: '', estado: '', hora: '', observacion: '' });
  saveSitrep();
  document.getElementById('acciones-rows').innerHTML = getCurrent().acciones.map((r, i) => renderAccionRow(r, i)).join('');
  attachListeners();
}

// ----------- 7. BRECHAS Y NECESIDADES -----------
function renderBrechas(s) {
  return `
    <div class="section-help">Sección clave del SITREP: transforma el reporte en herramienta de decisión. Identifique qué falta y qué prioridad tiene.</div>
    <div class="data-table-wrap">
      <table class="data-table">
        <thead><tr>
          <th style="width: 22%;">Brecha detectada</th>
          <th style="width: 13%;">Lugar</th>
          <th style="width: 18%;">Impacto</th>
          <th style="width: 19%;">Requerimiento</th>
          <th style="width: 16%;">Responsable sugerido</th>
          <th style="width: 12%;">Prioridad</th>
          <th class="col-action"></th>
        </tr></thead>
        <tbody id="brechas-rows">
          ${s.brechas.map((row, i) => renderBrechaRow(row, i)).join('')}
        </tbody>
      </table>
    </div>
    <button class="add-row-btn" onclick="addBrechaRow()">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      Agregar brecha
    </button>
  `;
}

function renderBrechaRow(row, i) {
  return `
    <tr>
      <td><textarea data-table="brechas" data-row="${i}" data-field="brecha">${escapeHtml(row.brecha || '')}</textarea></td>
      <td><input type="text" data-table="brechas" data-row="${i}" data-field="lugar" value="${escapeAttr(row.lugar || '')}"></td>
      <td><textarea data-table="brechas" data-row="${i}" data-field="impacto">${escapeHtml(row.impacto || '')}</textarea></td>
      <td><textarea data-table="brechas" data-row="${i}" data-field="requerimiento">${escapeHtml(row.requerimiento || '')}</textarea></td>
      <td><input type="text" data-table="brechas" data-row="${i}" data-field="responsable" value="${escapeAttr(row.responsable || '')}"></td>
      <td>
        <select data-table="brechas" data-row="${i}" data-field="prioridad">
          <option value="">—</option>
          ${PRIORIDADES.map(p => `<option value="${p}" ${row.prioridad === p ? 'selected' : ''}>${p}</option>`).join('')}
        </select>
      </td>
      <td class="col-action"><button class="row-delete" onclick="deleteRow('brechas', ${i})">✕</button></td>
    </tr>
  `;
}

function addBrechaRow() {
  getCurrent().brechas.push({ brecha: '', lugar: '', impacto: '', requerimiento: '', responsable: '', prioridad: '' });
  saveSitrep();
  document.getElementById('brechas-rows').innerHTML = getCurrent().brechas.map((r, i) => renderBrechaRow(r, i)).join('');
  attachListeners();
}

// ----------- 8. PRIORIDADES -----------
function renderPrioridades(s) {
  return `
    <div class="section-help">Definir antes o durante el COGRID 3 y 6 prioridades claras y accionables para el siguiente período operacional.</div>
    <div class="priority-list">
      ${s.prioridades.map((p, i) => `
        <div class="priority-item">
          <div class="priority-num">${i + 1}</div>
          <input type="text" data-bind-array="prioridades.${i}" value="${escapeAttr(p)}" placeholder="Prioridad ${i + 1}...">
        </div>
      `).join('')}
    </div>
  `;
}

// ----------- 9. PRÓXIMAS ACCIONES -----------
function renderProximas(s) {
  return `
    <div class="section-help">Acciones programadas para el próximo período, con responsable, plazo y producto esperado.</div>
    <div class="data-table-wrap">
      <table class="data-table">
        <thead><tr>
          <th style="width: 32%;">Acción próxima</th>
          <th style="width: 22%;">Responsable</th>
          <th style="width: 18%;">Plazo estimado</th>
          <th style="width: 28%;">Producto esperado</th>
          <th class="col-action"></th>
        </tr></thead>
        <tbody id="proximas-rows">
          ${s.proximas.map((row, i) => renderProximaRow(row, i)).join('')}
        </tbody>
      </table>
    </div>
    <button class="add-row-btn" onclick="addProximaRow()">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      Agregar próxima acción
    </button>
  `;
}

function renderProximaRow(row, i) {
  return `
    <tr>
      <td><textarea data-table="proximas" data-row="${i}" data-field="accion">${escapeHtml(row.accion || '')}</textarea></td>
      <td><input type="text" data-table="proximas" data-row="${i}" data-field="responsable" value="${escapeAttr(row.responsable || '')}"></td>
      <td><input type="text" data-table="proximas" data-row="${i}" data-field="plazo" value="${escapeAttr(row.plazo || '')}"></td>
      <td><input type="text" data-table="proximas" data-row="${i}" data-field="producto" value="${escapeAttr(row.producto || '')}"></td>
      <td class="col-action"><button class="row-delete" onclick="deleteRow('proximas', ${i})">✕</button></td>
    </tr>
  `;
}

function addProximaRow() {
  getCurrent().proximas.push({ accion: '', responsable: '', plazo: '', producto: '' });
  saveSitrep();
  document.getElementById('proximas-rows').innerHTML = getCurrent().proximas.map((r, i) => renderProximaRow(r, i)).join('');
  attachListeners();
}

// ----------- 10. FUENTES -----------
function renderFuentes(s) {
  return `
    <div class="section-help">Toda información debe ser trazable. Indique la fuente, qué información aportó y la hora.</div>
    <div class="data-table-wrap">
      <table class="data-table">
        <thead><tr>
          <th style="width: 25%;">Fuente</th>
          <th style="width: 40%;">Información aportada</th>
          <th style="width: 18%;">Estado del dato</th>
          <th style="width: 17%;">Hora</th>
          <th class="col-action"></th>
        </tr></thead>
        <tbody id="fuentes-rows">
          ${s.fuentes.map((row, i) => renderFuenteRow(row, i)).join('')}
        </tbody>
      </table>
    </div>
    <button class="add-row-btn" onclick="addFuenteRow()">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      Agregar fuente
    </button>
  `;
}

function renderFuenteRow(row, i) {
  return `
    <tr>
      <td><input type="text" data-table="fuentes" data-row="${i}" data-field="fuente" value="${escapeAttr(row.fuente || '')}"></td>
      <td><textarea data-table="fuentes" data-row="${i}" data-field="info">${escapeHtml(row.info || '')}</textarea></td>
      <td>
        <select data-table="fuentes" data-row="${i}" data-field="estado">
          <option value="">—</option>
          ${ESTADO_DATO.map(e => `<option value="${e}" ${row.estado === e ? 'selected' : ''}>${e}</option>`).join('')}
        </select>
      </td>
      <td><input type="time" data-table="fuentes" data-row="${i}" data-field="hora" value="${escapeAttr(row.hora || '')}"></td>
      <td class="col-action"><button class="row-delete" onclick="deleteRow('fuentes', ${i})">✕</button></td>
    </tr>
  `;
}

function addFuenteRow() {
  getCurrent().fuentes.push({ fuente: '', info: '', estado: '', hora: '' });
  saveSitrep();
  document.getElementById('fuentes-rows').innerHTML = getCurrent().fuentes.map((r, i) => renderFuenteRow(r, i)).join('');
  attachListeners();
}

// ----------- 11. OBSERVACIONES -----------
function renderObservaciones(s) {
  return `
    <div class="section-help">Restricciones del reporte, información pendiente o condiciones para próxima actualización.</div>
    <textarea class="field-textarea" data-bind="observaciones" rows="4" placeholder="Observaciones finales...">${escapeHtml(s.observaciones)}</textarea>
  `;
}

// ----------- 12. DISTRIBUCIÓN -----------
function renderDistribucion(s) {
  return `
    <div class="section-help">Registro de destinatarios del reporte para asegurar trazabilidad y conciencia situacional común.</div>
    <div class="data-table-wrap">
      <table class="data-table">
        <thead><tr>
          <th style="width: 50%;">Destinatario / Institución</th>
          <th style="width: 30%;">Cargo / Función</th>
          <th style="width: 20%;">Hora de envío</th>
          <th class="col-action"></th>
        </tr></thead>
        <tbody id="distribucion-rows">
          ${s.distribucion.map((row, i) => renderDistribucionRow(row, i)).join('')}
        </tbody>
      </table>
    </div>
    <button class="add-row-btn" onclick="addDistribucionRow()">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      Agregar destinatario
    </button>
  `;
}

function renderDistribucionRow(row, i) {
  return `
    <tr>
      <td><input type="text" data-table="distribucion" data-row="${i}" data-field="destinatario" value="${escapeAttr(row.destinatario || '')}"></td>
      <td><input type="text" data-table="distribucion" data-row="${i}" data-field="cargo" value="${escapeAttr(row.cargo || '')}"></td>
      <td><input type="time" data-table="distribucion" data-row="${i}" data-field="hora" value="${escapeAttr(row.hora || '')}"></td>
      <td class="col-action"><button class="row-delete" onclick="deleteRow('distribucion', ${i})">✕</button></td>
    </tr>
  `;
}

function addDistribucionRow() {
  getCurrent().distribucion.push({ destinatario: '', cargo: '', hora: '' });
  saveSitrep();
  document.getElementById('distribucion-rows').innerHTML = getCurrent().distribucion.map((r, i) => renderDistribucionRow(r, i)).join('');
  attachListeners();
}

// ----------- 13. VALIDACIÓN -----------
function renderValidacion(s) {
  const v = s.validacion;
  return `
    <div class="section-help">Datos de quien elabora y de quien revisa o aprueba el reporte.</div>
    <div class="field-row cols-2">
      <div>
        <h4 style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <span>Elaborado por</span>
          ${currentUser ? `<button type="button" class="add-row-btn" style="margin: 0;" onclick="usarMisDatosValidacion()">Usar mis datos</button>` : ''}
        </h4>
        <div class="field" style="margin-bottom: 8px;"><label class="field-label">Nombre</label>
          <input class="field-input" type="text" data-bind="validacion.elabNombre" value="${escapeAttr(v.elabNombre)}">
        </div>
        <div class="field" style="margin-bottom: 8px;"><label class="field-label">Cargo</label>
          <input class="field-input" type="text" data-bind="validacion.elabCargo" value="${escapeAttr(v.elabCargo)}">
        </div>
        <div class="field"><label class="field-label">Fecha y hora</label>
          <input class="field-input" type="datetime-local" data-bind="validacion.elabFecha" value="${escapeAttr(v.elabFecha)}">
        </div>
      </div>
      <div>
        <h4 style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px;">Revisado / Aprobado por</h4>
        <div class="field" style="margin-bottom: 8px;"><label class="field-label">Nombre</label>
          <input class="field-input" type="text" data-bind="validacion.revNombre" value="${escapeAttr(v.revNombre)}">
        </div>
        <div class="field" style="margin-bottom: 8px;"><label class="field-label">Cargo</label>
          <input class="field-input" type="text" data-bind="validacion.revCargo" value="${escapeAttr(v.revCargo)}">
        </div>
        <div class="field"><label class="field-label">Fecha y hora</label>
          <input class="field-input" type="datetime-local" data-bind="validacion.revFecha" value="${escapeAttr(v.revFecha)}">
        </div>
      </div>
    </div>
  `;
}
