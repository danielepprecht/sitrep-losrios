// ==========================================================================
// services/pdf.js — Generación de PDF con html2pdf
// ==========================================================================

// ============================================================
// GENERACIÓN DE PDF
// ============================================================
function generatePDF() {
  const s = getCurrent();
  if (!s) return;

  showToast('Generando PDF...', 'success');

  const html = buildPDFHtml(s);
  const tmp = document.getElementById('pdf-template');
  tmp.innerHTML = html;
  tmp.style.display = 'block';

  const opt = {
    margin: [10, 10, 12, 10],
    filename: `${s.id}.pdf`,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  html2pdf().set(opt).from(tmp.firstElementChild).save().then(() => {
    tmp.style.display = 'none';
    tmp.innerHTML = '';
    showToast('PDF descargado', 'success');
  }).catch((err) => {
    console.error(err);
    tmp.style.display = 'none';
    showToast('Error al generar PDF', 'error');
  });
}

function buildPDFHtml(s) {
  const fmtDateTime = (dt) => dt ? new Date(dt).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }) : '—';
  // Consolidar fuentes desde Punto 4 antes de emitir el PDF
  s.identificacion.fuentesPrincipales = getConsolidatedFuentes(s).join(', ');
  const i = s.identificacion;
  const sit = s.situacion;
  const v = s.validacion;

  const priorityClass = (p) => {
    if (p === 'Alta') return 'priority-high';
    if (p === 'Media') return 'priority-medium';
    if (p === 'Baja') return 'priority-low';
    return '';
  };

  const escape = escapeHtml;
  const orEmpty = (val) => val ? escape(val) : '<span class="pdf-empty">—</span>';

  const afectacionRows = s.afectacion.length === 0
    ? '<tr><td colspan="8" class="pdf-empty" style="text-align:center;">Sin registros</td></tr>'
    : s.afectacion.map(r => `
        <tr>
          <td>${orEmpty(r.comuna)}</td>
          <td>${orEmpty(r.sector)}</td>
          <td>${orEmpty(r.afectacionReporte)}</td>
          <td style="text-align: right; font-family: monospace;">${orEmpty(r.personas)}</td>
          <td style="text-align: right; font-family: monospace;">${orEmpty(r.viviendas)}</td>
          <td>${orEmpty(r.estado)}</td>
          <td>${orEmpty(r.fuente)}</td>
          <td>${orEmpty(r.hora)}</td>
        </tr>`).join('');

  const serviciosRows = s.servicios.map(r => {
    const comunasArr = Array.isArray(r.comunas) ? r.comunas : (r.comunas ? [r.comunas] : []);
    let comunasHtml;
    if (comunasArr.length === 0) {
      comunasHtml = '<span class="pdf-empty">—</span>';
    } else if (comunasArr.length === COMUNAS.length) {
      comunasHtml = '<strong style="background: #1F3864; color: #fff; padding: 2px 8px; border-radius: 10px; font-size: 8.5pt; letter-spacing: 0.04em;">REGIONAL</strong>';
    } else {
      comunasHtml = comunasArr.map(c => `<span style="background: #E8EFF8; color: #1F3864; padding: 1px 6px; border-radius: 8px; font-size: 8pt; margin-right: 2px; display: inline-block; margin-bottom: 1px;">${escape(c)}</span>`).join('');
    }
    let pobHtml = '<span class="pdf-empty">—</span>';
    if (r.poblacion && !isNaN(parseFloat(r.poblacion))) {
      const unidad = SERVICIOS_CLIENTES.includes((r.servicio || '').trim()) ? 'clientes' : 'personas';
      pobHtml = `<strong>${escape(r.poblacion)}</strong> <span style="font-size: 8pt; color: #5C5C66; font-style: italic;">${unidad}</span>`;
    } else if (r.poblacion) {
      pobHtml = escape(r.poblacion);
    }
    return `
    <tr>
      <td><strong>${escape(r.servicio || '')}</strong></td>
      <td>${orEmpty(r.estado)}</td>
      <td>${comunasHtml}</td>
      <td>${pobHtml}</td>
      <td>${orEmpty(r.accion)}</td>
      <td>${orEmpty(r.responsable)}</td>
      <td>${fmtDateTime(r.fechaHora)}</td>
      <td>${orEmpty(r.observacion)}</td>
    </tr>`;
  }).join('');

  // Consolidado por servicio y comuna: una fila por cada combinación servicio/comuna,
  // ordenada alfabéticamente por servicio y luego por comuna.
  const serviciosConsolidado = [];
  s.servicios.forEach(r => {
    const comunasArr = Array.isArray(r.comunas) ? r.comunas : (r.comunas ? [r.comunas] : []);
    const comunasList = comunasArr.length ? comunasArr : ['—'];
    comunasList.forEach(comuna => {
      serviciosConsolidado.push({
        servicio: r.servicio || '',
        comuna,
        estado: r.estado || '',
        poblacion: r.poblacion || ''
      });
    });
  });
  serviciosConsolidado.sort((a, b) =>
    a.servicio.localeCompare(b.servicio, 'es') || a.comuna.localeCompare(b.comuna, 'es')
  );
  const serviciosConsolidadoRows = serviciosConsolidado.length === 0
    ? '<tr><td colspan="4" class="pdf-empty" style="text-align:center;">Sin registros</td></tr>'
    : serviciosConsolidado.map(r => {
        let pobHtml = '<span class="pdf-empty">—</span>';
        if (r.poblacion && !isNaN(parseFloat(r.poblacion))) {
          const unidad = SERVICIOS_CLIENTES.includes(r.servicio.trim()) ? 'clientes' : 'personas';
          pobHtml = `<strong>${escape(r.poblacion)}</strong> <span style="font-size: 8pt; color: #5C5C66; font-style: italic;">${unidad}</span>`;
        } else if (r.poblacion) {
          pobHtml = escape(r.poblacion);
        }
        return `
    <tr>
      <td><strong>${escape(r.servicio)}</strong></td>
      <td>${escape(r.comuna)}</td>
      <td>${orEmpty(r.estado)}</td>
      <td>${pobHtml}</td>
    </tr>`;
      }).join('');

  const accionesRows = s.acciones.length === 0
    ? '<tr><td colspan="6" class="pdf-empty" style="text-align:center;">Sin registros</td></tr>'
    : s.acciones.map(r => `
        <tr>
          <td>${orEmpty(r.accion)}</td>
          <td>${orEmpty(r.institucion)}</td>
          <td>${orEmpty(r.lugar)}</td>
          <td>${orEmpty(r.estado)}</td>
          <td>${orEmpty(r.hora)}</td>
          <td>${orEmpty(r.observacion)}</td>
        </tr>`).join('');

  const brechasRows = s.brechas.length === 0
    ? '<tr><td colspan="6" class="pdf-empty" style="text-align:center;">Sin registros</td></tr>'
    : s.brechas.map(r => `
        <tr>
          <td>${orEmpty(r.brecha)}</td>
          <td>${orEmpty(r.lugar)}</td>
          <td>${orEmpty(r.impacto)}</td>
          <td>${orEmpty(r.requerimiento)}</td>
          <td>${orEmpty(r.responsable)}</td>
          <td><span class="${priorityClass(r.prioridad)}">${orEmpty(r.prioridad)}</span></td>
        </tr>`).join('');

  const prioridadesItems = s.prioridades.filter(p => p.trim()).map(p => `<li>${escape(p)}</li>`).join('') || '<li class="pdf-empty">Sin prioridades definidas</li>';

  const proximasRows = s.proximas.length === 0
    ? '<tr><td colspan="4" class="pdf-empty" style="text-align:center;">Sin registros</td></tr>'
    : s.proximas.map(r => `
        <tr>
          <td>${orEmpty(r.accion)}</td>
          <td>${orEmpty(r.responsable)}</td>
          <td>${orEmpty(r.plazo)}</td>
          <td>${orEmpty(r.producto)}</td>
        </tr>`).join('');

  const fuentesRows = s.fuentes.length === 0
    ? '<tr><td colspan="4" class="pdf-empty" style="text-align:center;">Sin registros</td></tr>'
    : s.fuentes.map(r => `
        <tr>
          <td>${orEmpty(r.fuente)}</td>
          <td>${orEmpty(r.info)}</td>
          <td>${orEmpty(r.estado)}</td>
          <td>${orEmpty(r.hora)}</td>
        </tr>`).join('');

  const distribucionRows = s.distribucion.length === 0
    ? '<tr><td colspan="3" class="pdf-empty" style="text-align:center;">Sin registros</td></tr>'
    : s.distribucion.map(r => `
        <tr>
          <td>${orEmpty(r.destinatario)}</td>
          <td>${orEmpty(r.cargo)}</td>
          <td>${orEmpty(r.hora)}</td>
        </tr>`).join('');

  const incidentesGeo = (i.incidentes || []).filter(x => x.lat != null);
  const manualMarkers = s.markers.filter(m => !m.auto);
  const markersList = (incidentesGeo.length + manualMarkers.length) === 0
    ? '<span class="pdf-empty">Sin puntos georreferenciados</span>'
    : (
        incidentesGeo.map((inc, idx) => `<div style="font-size: 9pt; margin-bottom: 3px; display: flex; align-items: center; gap: 6px;"><span style="display: inline-block; width: 12px; height: 12px; background: ${inc.color}; border-radius: 50%; flex-shrink: 0;"></span><strong>#${idx + 1}.</strong> ${escape(inc.sector || inc.comunas[0] || 'Incidente')} <span style="font-family: monospace; color: #5C5C66; font-size: 8.5pt;">(${inc.lat.toFixed(4)}, ${inc.lng.toFixed(4)})${!inc.geocoded ? ' aprox.' : ''}</span></div>`).join('')
        +
        manualMarkers.map((m, idx) => `<div style="font-size: 9pt; margin-bottom: 3px; display: flex; align-items: center; gap: 6px;"><span style="display: inline-block; width: 12px; height: 12px; background: #5C5C66; border-radius: 50%; flex-shrink: 0;"></span><strong>${String.fromCharCode(65 + idx)}.</strong> ${escape(m.label)} <span style="font-family: monospace; color: #5C5C66; font-size: 8.5pt;">(${m.lat.toFixed(4)}, ${m.lng.toFixed(4)})</span></div>`).join('')
      );

  return `
    <div class="pdf-doc">
      <div class="pdf-meta">
        <span>${s.id}</span>
        <span>F-PO-MAC-02R-01 V.03 · Generado: ${new Date().toLocaleString('es-CL')}</span>
      </div>
      <h1>REPORTE DE SITUACIÓN — SITREP</h1>
      <div class="pdf-subtitle">Informe de Incidente o Emergencia Regional</div>
      <div class="pdf-org">Sistema Regional de Protección Civil — SINAPRED / COGRID Región de Los Ríos</div>

      <h2>1. Identificación del reporte</h2>
      <table class="kv">
        <tr><td>N° SITREP</td><td><strong>${s.id}</strong></td></tr>
        <tr><td>Tipo de reporte</td><td>${orEmpty(i.tipoReporte)}</td></tr>
        <tr><td>Nombre del evento</td><td>${orEmpty(i.nombreEvento)}</td></tr>
        <tr><td>Tipo de amenaza</td><td>${orEmpty(i.tipoAmenaza)}</td></tr>
        <tr><td>Región</td><td>Los Ríos</td></tr>
        <tr><td>Período informado</td><td>desde ${fmtDateTime(i.periodoDesde)} hasta ${fmtDateTime(i.periodoHasta)}</td></tr>
        <tr><td>Hora de corte de información</td><td>${fmtDateTime(i.horaCorte)}</td></tr>
        <tr><td>Fecha y hora de emisión</td><td>${fmtDateTime(i.fechaEmision)}</td></tr>
        <tr><td>Próximo SITREP estimado</td><td>${fmtDateTime(i.proximoSitrep)}</td></tr>
        <tr><td>Responsable de consolidación</td><td>${orEmpty(i.responsable)}</td></tr>
        <tr><td>Fuentes principales utilizadas</td><td>${orEmpty(i.fuentesPrincipales)}</td></tr>
      </table>

      <h2 style="margin-top: 12px;">Matriz de incidentes</h2>
      ${(() => {
        const incidentes = i.incidentes || [];
        if (incidentes.length === 0) return '<div class="pdf-empty" style="padding: 8px 0;">Sin incidentes registrados.</div>';
        return `
          <table>
            <thead><tr>
              <th style="width: 6%;">#</th>
              <th style="width: 28%;">Comunas involucradas</th>
              <th style="width: 32%;">Sector o dirección</th>
              <th style="width: 22%;">Fecha y hora</th>
              <th style="width: 12%;">Coordenadas</th>
            </tr></thead>
            <tbody>
              ${incidentes.map((inc, idx) => {
                const comunaTxt = inc.comunas.length === COMUNAS.length
                  ? '<strong style="background: ' + inc.color + '; color: #fff; padding: 2px 8px; border-radius: 10px; font-size: 8.5pt; letter-spacing: 0.04em;">REGIONAL</strong>'
                  : inc.comunas.map(c => '<span style="background: ' + inc.color + '22; color: ' + inc.color + '; padding: 1px 6px; border-radius: 8px; font-size: 8pt; margin-right: 2px;">' + escape(c) + '</span>').join('');
                const coords = inc.lat != null
                  ? `<span style="font-family: monospace; font-size: 8pt;">${inc.lat.toFixed(4)}, ${inc.lng.toFixed(4)}</span>${!inc.geocoded ? '<br><span style="font-size: 7.5pt; color: #888;">aprox.</span>' : ''}`
                  : '<span class="pdf-empty">sin ubicar</span>';
                return `
                  <tr>
                    <td style="text-align: center;">
                      <span style="display: inline-flex; width: 18px; height: 18px; background: ${inc.color}; color: #fff; border-radius: 50%; align-items: center; justify-content: center; font-family: monospace; font-size: 8.5pt; font-weight: 700;">${idx + 1}</span>
                    </td>
                    <td>${comunaTxt || '<span class="pdf-empty">—</span>'}</td>
                    <td>${orEmpty(inc.sector)}</td>
                    <td>${fmtDateTime(inc.fechaHora)}</td>
                    <td>${coords}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        `;
      })()}

      <h2>2. Resumen ejecutivo</h2>
      ${(() => {
        const resumen = (s.resumen && typeof s.resumen === 'object') ? s.resumen : { general: '', porComuna: {} };
        const general = (resumen.general || '').trim();
        const porComuna = resumen.porComuna || {};
        const incidentes2 = (i.incidentes || []);
        const comunaColors2 = {};
        Object.keys(porComuna).forEach(c => {
          const inc = incidentes2.find(x => (x.comunas || []).includes(c));
          comunaColors2[c] = inc ? inc.color : '#1F3864';
        });
        const generalBlock = `<div class="pdf-summary-box">${general ? escape(general) : '<span class="pdf-empty">Sin resumen general registrado.</span>'}</div>`;
        const comunaEntries = Object.entries(porComuna).filter(([c, v]) => (v || '').trim());
        if (comunaEntries.length === 0) return generalBlock;
        return generalBlock + `
          <h3 style="font-size: 10pt; color: #1F3864; margin: 12px 0 6px; font-weight: 600;">Descripción por comuna</h3>
          ${comunaEntries.map(([c, v]) => {
            const color = comunaColors2[c] || '#1F3864';
            return `
              <div style="border-left: 3px solid ${color}; background: ${color}10; padding: 6px 10px; margin-bottom: 6px; border-radius: 0 4px 4px 0;">
                <div style="font-weight: 600; font-size: 9.5pt; color: #1F3864; margin-bottom: 3px;">
                  <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${color}; margin-right: 5px;"></span>${escape(c)}
                </div>
                <div style="font-size: 9pt; line-height: 1.45; white-space: pre-wrap;">${escape(v)}</div>
              </div>
            `;
          }).join('')}
        `;
      })()}

      <h2>3. Situación actual general</h2>
      <table class="kv">
        <tr><td>Evolución de la amenaza</td><td>${orEmpty(sit.evolucion)}</td></tr>
        <tr><td>Descripción técnica del fenómeno</td><td>${orEmpty(sit.descripcionTecnica)}</td></tr>
        <tr><td>Proyección de avance a Comunas / sectores afectados</td><td>${orEmpty(sit.comunasAfectadas)}</td></tr>
        <tr><td>Población expuesta o afectada</td><td>${orEmpty(sit.poblacionExpuesta)}</td></tr>
        <tr><td>Infraestructura comprometida</td><td>${orEmpty(sit.infraestructura)}</td></tr>
        <tr><td>Servicios críticos afectados</td><td>${orEmpty(sit.serviciosAfectados)}</td></tr>
        <tr><td>Comunidades aisladas</td><td>${orEmpty(sit.comunidadesAisladas)}</td></tr>
      </table>

      <h2>4. Afectación territorial</h2>
      <table>
        <thead><tr>
          <th>Comuna</th><th>Sector</th><th>Afectación</th>
          <th>Personas afectadas</th><th>Viviendas afectadas</th>
          <th>Estado</th><th>Fuente</th><th>Hora</th>
        </tr></thead>
        <tbody>${afectacionRows}</tbody>
      </table>

      <h2>5. Estado de servicios críticos</h2>
      <table>
        <thead><tr>
          <th>Servicio</th><th>Estado</th><th>Comunas</th>
          <th>Población afectada</th>
          <th>Acción en curso</th><th>Responsable</th>
          <th>Fecha y hora información</th>
          <th>Observación</th>
        </tr></thead>
        <tbody>${serviciosRows}</tbody>
      </table>

      <h3>5.1 Consolidado por servicio y comuna</h3>
      <table>
        <thead><tr>
          <th>Servicio</th><th>Comuna</th><th>Estado</th><th>Población afectada</th>
        </tr></thead>
        <tbody>${serviciosConsolidadoRows}</tbody>
      </table>

      <h2>6. Acciones ejecutadas</h2>
      <table>
        <thead><tr>
          <th>Acción</th><th>Institución</th><th>Lugar</th>
          <th>Estado</th><th>Hora</th><th>Observación</th>
        </tr></thead>
        <tbody>${accionesRows}</tbody>
      </table>

      <h2>7. Brechas y necesidades</h2>
      <table>
        <thead><tr>
          <th>Brecha</th><th>Lugar</th><th>Impacto</th>
          <th>Requerimiento</th><th>Responsable</th><th>Prioridad</th>
        </tr></thead>
        <tbody>${brechasRows}</tbody>
      </table>

      <h2>8. Prioridades del próximo período</h2>
      <ol class="pdf-priority-list">${prioridadesItems}</ol>

      <h2>9. Próximas acciones programadas</h2>
      <table>
        <thead><tr>
          <th>Acción próxima</th><th>Responsable</th><th>Plazo</th><th>Producto esperado</th>
        </tr></thead>
        <tbody>${proximasRows}</tbody>
      </table>

      <h2>10. Fuentes de información</h2>
      <table>
        <thead><tr>
          <th>Fuente</th><th>Información aportada</th><th>Estado del dato</th><th>Hora</th>
        </tr></thead>
        <tbody>${fuentesRows}</tbody>
      </table>

      <h2>11. Georreferenciación de incidentes</h2>
      <div style="padding: 8px 0;">${markersList}</div>

      <h2>12. Observaciones finales</h2>
      <div class="pdf-summary-box">${s.observaciones.trim() ? escape(s.observaciones) : '<span class="pdf-empty">Sin observaciones.</span>'}</div>

      <h2>13. Distribución del reporte</h2>
      <table>
        <thead><tr>
          <th>Destinatario / Institución</th><th>Cargo / Función</th><th>Hora de envío</th>
        </tr></thead>
        <tbody>${distribucionRows}</tbody>
      </table>

      <h2>14. Validación</h2>
      <table class="kv">
        <tr><td>Elaborado por</td><td>${orEmpty(v.elabNombre)} ${v.elabCargo ? '— ' + escape(v.elabCargo) : ''} ${v.elabFecha ? '<br><span style="font-family: monospace; font-size: 8.5pt; color: #5C5C66;">' + fmtDateTime(v.elabFecha) + '</span>' : ''}</td></tr>
        <tr><td>Revisado / Aprobado por</td><td>${orEmpty(v.revNombre)} ${v.revCargo ? '— ' + escape(v.revCargo) : ''} ${v.revFecha ? '<br><span style="font-family: monospace; font-size: 8.5pt; color: #5C5C66;">' + fmtDateTime(v.revFecha) + '</span>' : ''}</td></tr>
      </table>

      <div class="pdf-footer">
        <strong>Nota institucional:</strong> Este Reporte de Situación es un producto operativo de gestión de información destinado a apoyar la toma de decisiones del SINAPRED y del COGRID de la Región de Los Ríos. No reemplaza los informes técnicos emitidos por los organismos competentes, el EDAN, las actas formales del COGRID ni las decisiones administrativas que correspondan conforme al marco jurídico vigente (Ley N° 21.364). Tampoco constituye una orden táctica del Sistema de Comando de Incidentes (SCI), el cual opera en el nivel táctico de la respuesta en terreno.
      </div>
    </div>
  `;
}
