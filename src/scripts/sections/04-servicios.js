// ==========================================================================
// sections/servicios.js — Punto 5: Estado de servicios críticos
// ==========================================================================
// Servicios que se miden en "clientes" en lugar de "personas"
const SERVICIOS_CLIENTES = ['Energía eléctrica', 'Agua potable / SSR-APR', 'Telecomunicaciones'];

function getServicioUnidad(servicio) {
  return SERVICIOS_CLIENTES.includes((servicio || '').trim()) ? 'clientes' : 'personas';
}

function renderServicios(s) {
  return `
    <div class="section-help">Estado de los servicios esenciales. Las filas estándar están preconfiguradas; puede ajustar el contenido o agregar adicionales. En "Población afectada" la unidad se muestra como <strong>clientes</strong> para Energía eléctrica, Agua potable / SSR-APR y Telecomunicaciones; para los demás servicios se muestra como <strong>personas</strong>.</div>
    <div class="data-table-wrap">
      <table class="data-table">
        <thead><tr>
          <th style="width: 12%;">Servicio</th>
          <th style="width: 10%;">Estado</th>
          <th style="width: 14%;">Comunas afectadas</th>
          <th style="width: 11%;">Población afectada</th>
          <th style="width: 16%;">Acción en curso</th>
          <th style="width: 11%;">Responsable</th>
          <th style="width: 13%;">Fecha y hora información</th>
          <th style="width: 13%;">Observación</th>
          <th class="col-action"></th>
        </tr></thead>
        <tbody id="servicios-rows">
          ${s.servicios.map((row, i) => renderServicioRow(row, i)).join('')}
        </tbody>
      </table>
    </div>
    <button class="add-row-btn" onclick="addServicioRow()">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      Agregar servicio
    </button>
  `;
}

function renderServicioRow(row, i) {
  const unidad = getServicioUnidad(row.servicio);
  const poblacionVal = row.poblacion || '';
  const numeric = poblacionVal && !isNaN(parseFloat(poblacionVal));
  return `
    <tr>
      <td><input type="text" data-table="servicios" data-row="${i}" data-field="servicio" value="${escapeAttr(row.servicio || '')}" style="font-weight: 500;" onchange="onServicioNameChange(${i})"></td>
      <td>
        <select data-table="servicios" data-row="${i}" data-field="estado">
          <option value="">—</option>
          ${['Operativo', 'Operativo parcial', 'Interrumpido', 'En evaluación'].map(e => `<option value="${e}" ${row.estado === e ? 'selected' : ''}>${e}</option>`).join('')}
        </select>
      </td>
      <td>${renderSrvComunasMultiselect(row, i)}</td>
      <td>
        <div class="srv-poblacion-wrap" data-srv-idx="${i}">
          <input type="text" inputmode="numeric" data-table="servicios" data-row="${i}" data-field="poblacion"
                 value="${escapeAttr(poblacionVal)}"
                 placeholder="N°"
                 oninput="onPoblacionInput(${i})"
                 class="srv-poblacion-input">
          <span class="srv-poblacion-unit ${numeric ? 'visible' : ''}" id="srv-unit-${i}">${unidad}</span>
        </div>
      </td>
      <td><textarea data-table="servicios" data-row="${i}" data-field="accion">${escapeHtml(row.accion || '')}</textarea></td>
      <td><input type="text" data-table="servicios" data-row="${i}" data-field="responsable" value="${escapeAttr(row.responsable || '')}"></td>
      <td><input type="datetime-local" data-table="servicios" data-row="${i}" data-field="fechaHora" value="${escapeAttr(row.fechaHora || '')}"></td>
      <td><textarea data-table="servicios" data-row="${i}" data-field="observacion">${escapeHtml(row.observacion || '')}</textarea></td>
      <td class="col-action"><button class="row-delete" onclick="deleteRow('servicios', ${i})">✕</button></td>
    </tr>
  `;
}

function renderSrvComunasMultiselect(row, i) {
  const selected = Array.isArray(row.comunas) ? row.comunas : [];
  const allSelected = selected.length === COMUNAS.length;
  const noneSelected = selected.length === 0;

  let displayHtml;
  if (noneSelected) {
    displayHtml = `<span class="multiselect-display placeholder">— Seleccionar —</span>`;
  } else if (allSelected) {
    displayHtml = `<span class="regional-badge">Regional</span>`;
  } else {
    displayHtml = selected.map(c => `<span class="comuna-tag">${escapeHtml(c)}</span>`).join('');
  }

  const optionsHtml = COMUNAS.map(c => {
    const isSel = selected.includes(c.name);
    return `
      <label class="multiselect-option ${isSel ? 'selected' : ''}" onclick="event.stopPropagation();">
        <input type="checkbox" ${isSel ? 'checked' : ''} onchange="toggleSrvComuna(${i}, '${escapeAttr(c.name)}', this.checked)">
        <span>${escapeHtml(c.name)}</span>
        <span class="opt-prov">${escapeHtml(c.prov)}</span>
      </label>
    `;
  }).join('');

  return `
    <div class="multiselect srv-multiselect" data-srv-idx="${i}">
      <button type="button" class="multiselect-trigger srv-multiselect-trigger" onclick="toggleSrvMenu(event, ${i})">
        <div class="multiselect-display">${displayHtml}</div>
        <svg class="multiselect-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </button>
      <div class="multiselect-menu">
        <div class="multiselect-menu-header">
          <span>${selected.length} de ${COMUNAS.length}</span>
          <div>
            <button type="button" onclick="selectAllSrvComunas(${i})">Todas</button>
            <button type="button" onclick="clearAllSrvComunas(${i})">Ninguna</button>
          </div>
        </div>
        <div class="multiselect-options">${optionsHtml}</div>
      </div>
    </div>
  `;
}

function toggleSrvMenu(e, i) {
  e.stopPropagation();
  // Cerrar otros
  document.querySelectorAll('.srv-multiselect.open').forEach(el => {
    if (parseInt(el.dataset.srvIdx, 10) !== i) {
      el.classList.remove('open');
      el.querySelector('.multiselect-trigger')?.classList.remove('open');
    }
  });
  const ms = document.querySelector(`.srv-multiselect[data-srv-idx="${i}"]`);
  if (!ms) return;
  ms.classList.toggle('open');
  ms.querySelector('.multiselect-trigger').classList.toggle('open', ms.classList.contains('open'));
}

// Cierre por clic fuera para srv-multiselect
document.addEventListener('click', (e) => {
  document.querySelectorAll('.srv-multiselect.open').forEach(ms => {
    if (!ms.contains(e.target)) {
      ms.classList.remove('open');
      ms.querySelector('.multiselect-trigger')?.classList.remove('open');
    }
  });
});

function toggleSrvComuna(i, name, checked) {
  const s = getCurrent();
  if (!s || !s.servicios[i]) return;
  if (!Array.isArray(s.servicios[i].comunas)) s.servicios[i].comunas = [];
  const arr = s.servicios[i].comunas;
  const idx = arr.indexOf(name);
  if (checked && idx === -1) arr.push(name);
  if (!checked && idx !== -1) arr.splice(idx, 1);
  saveSitrep();
  refreshSrvRow(i, true);
}

function selectAllSrvComunas(i) {
  const s = getCurrent();
  if (!s || !s.servicios[i]) return;
  s.servicios[i].comunas = COMUNAS.map(c => c.name);
  saveSitrep();
  refreshSrvRow(i, true);
}

function clearAllSrvComunas(i) {
  const s = getCurrent();
  if (!s || !s.servicios[i]) return;
  s.servicios[i].comunas = [];
  saveSitrep();
  refreshSrvRow(i, true);
}

function refreshSrvRow(i, keepOpen) {
  const s = getCurrent();
  if (!s || !s.servicios[i]) return;
  const rowEl = document.querySelectorAll('#servicios-rows tr')[i];
  if (!rowEl) return;
  rowEl.outerHTML = renderServicioRow(s.servicios[i], i);
  attachListeners();
  if (keepOpen) {
    const ms = document.querySelector(`.srv-multiselect[data-srv-idx="${i}"]`);
    if (ms) {
      ms.classList.add('open');
      ms.querySelector('.multiselect-trigger')?.classList.add('open');
    }
  }
  updateProgress();
}

function onPoblacionInput(i) {
  const s = getCurrent();
  if (!s || !s.servicios[i]) return;
  const input = document.querySelector(`.srv-poblacion-wrap[data-srv-idx="${i}"] input`);
  const unit = document.getElementById('srv-unit-' + i);
  const val = input.value;
  s.servicios[i].poblacion = val;
  saveSitrep();
  // Mostrar/ocultar unidad según si hay número
  const isNum = val && !isNaN(parseFloat(val));
  if (unit) unit.classList.toggle('visible', !!isNum);
  updateProgress();
}

function onServicioNameChange(i) {
  // Cuando cambia el nombre del servicio, actualizar la etiqueta de unidad
  const s = getCurrent();
  if (!s || !s.servicios[i]) return;
  const unit = document.getElementById('srv-unit-' + i);
  if (unit) {
    unit.textContent = getServicioUnidad(s.servicios[i].servicio);
  }
}

function addServicioRow() {
  getCurrent().servicios.push({ servicio: '', estado: '', comunas: [], poblacion: '', accion: '', responsable: '', fechaHora: '', observacion: '' });
  saveSitrep();
  document.getElementById('servicios-rows').innerHTML = getCurrent().servicios.map((r, i) => renderServicioRow(r, i)).join('');
  attachListeners();
}

