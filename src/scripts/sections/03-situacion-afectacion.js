// ==========================================================================
// sections/situacion-afectacion.js — Punto 3 (situación) y 4 (afectación)
// ==========================================================================
// ----------- 3. SITUACIÓN ACTUAL -----------
function renderSituacion(s) {
  const sit = s.situacion;
  return `
    <div class="section-help">Estado vigente de la amenaza, su evolución y alcance territorial. Diferencie la amenaza (fenómeno) del impacto (consecuencias).</div>

    <div class="field-row">
      <div class="field">
        <label class="field-label">Evolución de la amenaza</label>
        <div class="option-group">
          ${['Aumenta', 'Se mantiene', 'Disminuye', 'En evaluación'].map(opt => `
            <label class="option-chip ${sit.evolucion === opt ? 'selected' : ''}">
              <input type="radio" name="evolucion" value="${opt}" ${sit.evolucion === opt ? 'checked' : ''}>
              ${opt}
            </label>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="field"><label class="field-label">Descripción técnica del fenómeno</label>
      <textarea class="field-textarea" data-bind="situacion.descripcionTecnica" rows="3" placeholder="Caracterización del fenómeno...">${escapeHtml(sit.descripcionTecnica)}</textarea>
    </div>

    <div class="field-row cols-2">
      <div class="field"><label class="field-label">Proyección de avance a Comunas / sectores afectados (nómbrelos)</label>
        <textarea class="field-textarea" data-bind="situacion.comunasAfectadas" rows="2">${escapeHtml(sit.comunasAfectadas)}</textarea>
      </div>
      <div class="field"><label class="field-label">Población expuesta o afectada</label>
        <textarea class="field-textarea" data-bind="situacion.poblacionExpuesta" rows="2">${escapeHtml(sit.poblacionExpuesta)}</textarea>
      </div>
    </div>

    <div class="field-row cols-2">
      <div class="field"><label class="field-label">Infraestructura comprometida</label>
        <textarea class="field-textarea" data-bind="situacion.infraestructura" rows="2">${escapeHtml(sit.infraestructura)}</textarea>
      </div>
      <div class="field"><label class="field-label">Servicios críticos afectados</label>
        <textarea class="field-textarea" data-bind="situacion.serviciosAfectados" rows="2">${escapeHtml(sit.serviciosAfectados)}</textarea>
      </div>
    </div>

    <div class="field"><label class="field-label">Comunidades aisladas (si aplica)</label>
      <textarea class="field-textarea" data-bind="situacion.comunidadesAisladas" rows="2">${escapeHtml(sit.comunidadesAisladas)}</textarea>
    </div>
  `;
}

// ----------- 4. AFECTACIÓN TERRITORIAL -----------
function renderAfectacion(s) {
  return `
    <div class="section-help">Detalle por comuna y sector. La comuna se selecciona desde el listado oficial de las 12 comunas de la Región de Los Ríos. Personas afectadas y viviendas afectadas se registran en columnas separadas.</div>
    <div class="data-table-wrap">
      <table class="data-table">
        <thead><tr>
          <th style="width: 12%;">Comuna</th>
          <th style="width: 14%;">Sector / localidad</th>
          <th style="width: 20%;">Afectación reportada</th>
          <th style="width: 10%;">Personas afectadas</th>
          <th style="width: 10%;">Viviendas afectadas</th>
          <th style="width: 11%;">Estado del dato</th>
          <th style="width: 12%;">Fuente</th>
          <th style="width: 8%;">Hora</th>
          <th class="col-action"></th>
        </tr></thead>
        <tbody id="afectacion-rows">
          ${s.afectacion.map((row, i) => renderAfectacionRow(row, i)).join('')}
        </tbody>
      </table>
    </div>
    <button class="add-row-btn" onclick="addAfectacionRow()">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      Agregar fila
    </button>
  `;
}

function renderAfectacionRow(row, i) {
  return `
    <tr>
      <td>
        <select data-table="afectacion" data-row="${i}" data-field="comuna">
          ${COMUNAS_OPTIONS_HTML.replace(`value="${row.comuna}"`, `value="${row.comuna}" selected`)}
        </select>
      </td>
      <td><input type="text" data-table="afectacion" data-row="${i}" data-field="sector" value="${escapeAttr(row.sector || '')}"></td>
      <td><textarea data-table="afectacion" data-row="${i}" data-field="afectacionReporte">${escapeHtml(row.afectacionReporte || '')}</textarea></td>
      <td><input type="text" inputmode="numeric" data-table="afectacion" data-row="${i}" data-field="personas" value="${escapeAttr(row.personas || '')}" placeholder="N°" style="font-family: var(--font-mono); text-align: right;"></td>
      <td><input type="text" inputmode="numeric" data-table="afectacion" data-row="${i}" data-field="viviendas" value="${escapeAttr(row.viviendas || '')}" placeholder="N°" style="font-family: var(--font-mono); text-align: right;"></td>
      <td>
        <select data-table="afectacion" data-row="${i}" data-field="estado">
          <option value="">—</option>
          ${ESTADO_DATO.map(e => `<option value="${e}" ${row.estado === e ? 'selected' : ''}>${e}</option>`).join('')}
        </select>
      </td>
      <td><input type="text" data-table="afectacion" data-row="${i}" data-field="fuente" value="${escapeAttr(row.fuente || '')}"></td>
      <td><input type="time" data-table="afectacion" data-row="${i}" data-field="hora" value="${escapeAttr(row.hora || '')}"></td>
      <td class="col-action"><button class="row-delete" onclick="deleteRow('afectacion', ${i})" title="Eliminar fila">✕</button></td>
    </tr>
  `;
}

function addAfectacionRow() {
  getCurrent().afectacion.push({ comuna: '', sector: '', afectacionReporte: '', personas: '', viviendas: '', estado: '', fuente: '', hora: '' });
  saveSitrep();
  document.getElementById('afectacion-rows').innerHTML = getCurrent().afectacion.map((r, i) => renderAfectacionRow(r, i)).join('');
  attachListeners();
}

// ----------- 5. SERVICIOS CRÍTICOS -----------

