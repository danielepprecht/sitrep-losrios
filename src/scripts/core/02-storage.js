// ==========================================================================
// core/storage.js — Persistencia en localStorage + migraciones
// ==========================================================================
// ============================================================
// PERSISTENCIA
// ============================================================
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state = JSON.parse(raw);
    // Migración de estructuras antiguas
    Object.values(state.sitreps || {}).forEach(s => {
      if (!s.identificacion) return;
      // Migrar comunas string/array y sectorDireccion → array incidentes
      if (s.identificacion.incidentes === undefined) {
        const incidentes = [];
        const oldComunas = s.identificacion.comunas;
        const oldSector = s.identificacion.sectorDireccion || '';
        const oldFecha = s.identificacion.fechaHoraEvento || '';
        let comunasArr = [];
        if (Array.isArray(oldComunas)) comunasArr = oldComunas;
        else if (typeof oldComunas === 'string' && oldComunas) {
          comunasArr = oldComunas.split(',').map(x => x.trim()).filter(Boolean);
        }
        if (comunasArr.length > 0 || oldSector || oldFecha) {
          incidentes.push({
            id: 'inc_' + Date.now(),
            comunas: comunasArr,
            sector: oldSector,
            fechaHora: oldFecha,
            color: INCIDENT_COLORS[0],
            lat: null,
            lng: null,
            geocoded: false,
            geocodeStatus: ''
          });
        }
        s.identificacion.incidentes = incidentes;
        delete s.identificacion.comunas;
        delete s.identificacion.sectorDireccion;
        delete s.identificacion.fechaHoraEvento;
      }
      // Migrar servicios: comunas string→array, agregar poblacion
      if (Array.isArray(s.servicios)) {
        s.servicios.forEach(row => {
          if (typeof row.comunas === 'string') {
            row.comunas = row.comunas
              ? row.comunas.split(',').map(x => x.trim()).filter(Boolean)
              : [];
          }
          if (row.poblacion === undefined) row.poblacion = '';
          if (row.fechaHora === undefined) row.fechaHora = '';
        });
      }
      // Migrar afectación: agregar viviendas si no existe
      if (Array.isArray(s.afectacion)) {
        s.afectacion.forEach(row => {
          if (row.viviendas === undefined) row.viviendas = '';
        });
      }
      // Migrar resumen string → objeto
      if (typeof s.resumen === 'string') {
        s.resumen = { general: s.resumen, porComuna: {}, generalEditado: !!s.resumen };
      } else if (s.resumen && typeof s.resumen === 'object') {
        if (s.resumen.general === undefined) s.resumen.general = '';
        if (!s.resumen.porComuna || typeof s.resumen.porComuna !== 'object') s.resumen.porComuna = {};
        if (s.resumen.generalEditado === undefined) {
          // Si ya hay texto general previo, asumimos que fue editado manualmente para no sobrescribirlo
          s.resumen.generalEditado = !!(s.resumen.general || '').trim();
        }
      } else {
        s.resumen = { general: '', porComuna: {}, generalEditado: false };
      }
    });
  } catch (e) { console.error('Error cargando estado:', e); }
}

function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) { console.error('Error guardando estado:', e); }
}

function getNextSitrepNumber() {
  const year = new Date().getFullYear();
  let counter = parseInt(localStorage.getItem(COUNTER_KEY + '_' + year) || '0', 10);
  counter += 1;
  localStorage.setItem(COUNTER_KEY + '_' + year, String(counter));
  return `SITREP-${year}-${String(counter).padStart(3, '0')}`;
}
