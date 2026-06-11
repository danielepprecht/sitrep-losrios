// ==========================================================================
// core/handlers.js — Event listeners y handlers de inputs/bindings
// ==========================================================================

// ============================================================
// LISTENERS
// ============================================================
function attachListeners() {
  // Bindings simples
  document.querySelectorAll('[data-bind]').forEach(el => {
    el.removeEventListener('input', onBindInput);
    el.addEventListener('input', onBindInput);
  });

  // Bindings de array (prioridades)
  document.querySelectorAll('[data-bind-array]').forEach(el => {
    el.removeEventListener('input', onBindArrayInput);
    el.addEventListener('input', onBindArrayInput);
  });

  // Bindings de tabla
  document.querySelectorAll('[data-table]').forEach(el => {
    el.removeEventListener('input', onTableInput);
    el.addEventListener('input', onTableInput);
    el.removeEventListener('change', onTableInput);
    el.addEventListener('change', onTableInput);
  });

  // Radio chips
  document.querySelectorAll('.option-chip input[type="radio"]').forEach(el => {
    el.removeEventListener('change', onRadioChange);
    el.addEventListener('change', onRadioChange);
  });
}

function onBindInput(e) {
  const path = e.target.dataset.bind;
  setByPath(getCurrent(), path, e.target.value);
  saveSitrep();
  if (path === 'identificacion.nombreEvento') renderSitrepList();
  updateProgress();
}

function onBindArrayInput(e) {
  const [field, idx] = e.target.dataset.bindArray.split('.');
  getCurrent()[field][parseInt(idx, 10)] = e.target.value;
  saveSitrep();
  updateProgress();
}

function onTableInput(e) {
  const t = e.target.dataset.table;
  const r = parseInt(e.target.dataset.row, 10);
  const f = e.target.dataset.field;
  getCurrent()[t][r][f] = e.target.value;
  saveSitrep();

  // Si cambió la comuna en afectación, hacer zoom a la comuna
  if (t === 'afectacion' && f === 'comuna' && e.target.value) {
    const comuna = COMUNAS.find(c => c.name === e.target.value);
    if (comuna && map) {
      map.flyTo([comuna.lat, comuna.lng], 11, { duration: 0.8 });
    }
  }
  // Si cambió la columna Fuente del Punto 4, refrescar la consolidación del Punto 1
  if (t === 'afectacion' && f === 'fuente') {
    refreshFuentesAuto();
  }
  updateProgress();
}

function onRadioChange(e) {
  const groupName = e.target.name;
  const value = e.target.value;
  const wrapper = e.target.closest('.option-group');

  if (groupName === 'tipoReporte') {
    getCurrent().identificacion.tipoReporte = value;
  } else if (groupName === 'evolucion') {
    getCurrent().situacion.evolucion = value;
  }

  wrapper.querySelectorAll('.option-chip').forEach(chip => chip.classList.remove('selected'));
  e.target.closest('.option-chip').classList.add('selected');
  saveSitrep();
  updateProgress();
}

function deleteRow(table, idx) {
  getCurrent()[table].splice(idx, 1);
  saveSitrep();
  // Re-renderizar la sección entera para que los índices se recalculen
  renderCurrentSitrep();
}
