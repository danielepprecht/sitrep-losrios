// ==========================================================================
// services/import-export.js — Exportación e importación JSON
// ==========================================================================

// ============================================================
// EXPORTAR / IMPORTAR JSON
// ============================================================
function exportJSON() {
  const s = getCurrent();
  if (!s) return;
  const data = JSON.stringify(s, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${s.id}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('JSON exportado', 'success');
}

function importJSON(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!data.id) throw new Error('Archivo inválido');
      // Si ya existe, mantener id pero pedir confirmación
      if (state.sitreps[data.id]) {
        showModal({
          title: 'Reporte ya existe',
          message: `Ya existe un reporte con ID ${data.id}. ¿Sobrescribir?`,
          confirmText: 'Sobrescribir',
          onConfirm: () => doImport(data)
        });
      } else {
        doImport(data);
      }
    } catch (err) {
      showToast('Error al importar JSON', 'error');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function doImport(data) {
  state.sitreps[data.id] = data;
  state.currentId = data.id;
  saveToStorage();
  renderSitrepList();
  renderCurrentSitrep();
  showToast(`Reporte ${data.id} importado`, 'success');
}
