// ==========================================================================
// core/progress.js — Cálculo de progreso de completitud por sección
// ==========================================================================

// ============================================================
// PROGRESO
// ============================================================
function updateProgress() {
  const s = getCurrent();
  if (!s) return;

  const checks = {
    identificacion: !!(s.identificacion.nombreEvento && s.identificacion.tipoAmenaza && s.identificacion.responsable && (s.identificacion.incidentes || []).length > 0),
    resumen: !!(s.resumen && typeof s.resumen === 'object' && (s.resumen.general || '').trim().length > 30),
    situacion: !!(s.situacion.evolucion && s.situacion.descripcionTecnica),
    afectacion: s.afectacion.length > 0 && s.afectacion.some(r => r.comuna),
    servicios: s.servicios.some(r => r.estado),
    acciones: s.acciones.length > 0 && s.acciones.some(r => r.accion),
    brechas: s.brechas.length > 0 && s.brechas.some(r => r.brecha),
    prioridades: s.prioridades.filter(p => p.trim()).length >= 3,
    proximas: s.proximas.length > 0 && s.proximas.some(r => r.accion),
    fuentes: s.fuentes.length > 0 && s.fuentes.some(r => r.fuente),
    observaciones: s.observaciones.trim().length > 5,
    distribucion: s.distribucion.length > 0 && s.distribucion.some(r => r.destinatario),
    validacion: !!(s.validacion.elabNombre && s.validacion.elabCargo)
  };

  Object.keys(checks).forEach(id => {
    const dot = document.getElementById('nav-check-' + id);
    if (dot) dot.classList.toggle('filled', checks[id]);
  });

  const total = Object.keys(checks).length;
  const completed = Object.values(checks).filter(Boolean).length;
  const pct = Math.round((completed / total) * 100);
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-text').textContent = `${pct}% completo · ${completed} de ${total} secciones`;
}
