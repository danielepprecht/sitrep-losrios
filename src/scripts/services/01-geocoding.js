// ==========================================================================
// services/geocoding.js — Sistema multi-proveedor con fallback automático
// Photon (Komoot) + Nominatim directo + Nominatim JSONP
// ==========================================================================
// ----------- 1. IDENTIFICACIÓN -----------
// ============================================================
// MATRIZ DE INCIDENTES (comuna + sector + fecha/hora con georreferenciación)
// ============================================================

function nextIncidentColor(s) {
  const used = new Set((s.identificacion.incidentes || []).map(x => x.color));
  for (const c of INCIDENT_COLORS) {
    if (!used.has(c)) return c;
  }
  return INCIDENT_COLORS[(s.identificacion.incidentes.length) % INCIDENT_COLORS.length];
}

function addIncidente() {
  const s = getCurrent();
  if (!s) return;
  s.identificacion.incidentes.push({
    id: 'inc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    comunas: [],
    sector: '',
    fechaHora: '',
    color: nextIncidentColor(s),
    lat: null,
    lng: null,
    geocoded: false,
    geocodeStatus: ''
  });
  saveSitrep();
  refreshIncidentesMatrix();
  renderMarkers();
}

function removeIncidente(incId) {
  const s = getCurrent();
  if (!s) return;
  s.identificacion.incidentes = s.identificacion.incidentes.filter(x => x.id !== incId);
  saveSitrep();
  refreshIncidentesMatrix();
  renderMarkers();
}

function getIncidente(incId) {
  const s = getCurrent();
  return s ? s.identificacion.incidentes.find(x => x.id === incId) : null;
}

function refreshIncidentesMatrix() {
  const s = getCurrent();
  if (!s) return;
  const container = document.getElementById('incidentes-matrix');
  if (!container) return;
  // Mantener qué multiselects estaban abiertos
  const openIds = Array.from(document.querySelectorAll('.inc-multiselect.open'))
    .map(el => el.dataset.incId);
  container.innerHTML = renderIncidentesMatrix(s.identificacion.incidentes);
  openIds.forEach(id => {
    const el = document.querySelector(`.inc-multiselect[data-inc-id="${id}"]`);
    if (el) {
      el.classList.add('open');
      el.querySelector('.multiselect-trigger')?.classList.add('open');
    }
  });
  // Refrescar también la sección de Resumen ejecutivo (depende de las comunas)
  refreshResumenSection();
  updateProgress();
}

function refreshResumenSection() {
  const s = getCurrent();
  if (!s) return;
  const sec = document.getElementById('section-resumen');
  if (!sec) return;
  const body = sec.querySelector('.section-body');
  if (body) body.innerHTML = renderResumen(s);
}

function renderIncidentesMatrix(incidentes) {
  if (!incidentes || incidentes.length === 0) {
    return `
      <div class="incidentes-empty">
        <p>No hay incidentes registrados</p>
        <button type="button" class="btn btn-secondary" onclick="addIncidente()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Agregar primer incidente
        </button>
      </div>
    `;
  }
  return `
    <div class="incidentes-table-wrap">
      <table class="incidentes-table">
        <thead><tr>
          <th style="width: 34%;">Comunas involucradas</th>
          <th style="width: 38%;">Sector o dirección del incidente</th>
          <th style="width: 28%;">Fecha y hora del evento</th>
        </tr></thead>
        <tbody>
          ${incidentes.map((inc, idx) => renderIncidenteRow(inc, idx)).join('')}
        </tbody>
      </table>
    </div>
    <button type="button" class="add-row-btn" onclick="addIncidente()">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      Agregar incidente
    </button>
  `;
}

function renderIncidenteRow(inc, idx) {
  return `
    <tr class="inc-row"
        style="--inc-color: ${inc.color}; --inc-bg: ${inc.color}14; --inc-bg-hover: ${inc.color}22;">
      <td class="inc-cell inc-cell-comunas">
        <div class="inc-row-badge" style="background: ${inc.color};">${idx + 1}</div>
        ${renderIncComunasMultiselect(inc)}
        ${renderIncGeoIndicator(inc)}
        <button class="inc-row-delete" onclick="removeIncidente('${inc.id}')" title="Eliminar fila">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </td>
      <td class="inc-cell">
        <input type="text" class="inc-sector-input" value="${escapeAttr(inc.sector || '')}"
               placeholder="Ej: Av. Picarte 1500 / Sector Niebla / Ruta T-350"
               oninput="updateIncidente('${inc.id}', 'sector', this.value)">
      </td>
      <td class="inc-cell">
        <input type="datetime-local" class="inc-date-input" value="${escapeAttr(inc.fechaHora || '')}"
               oninput="updateIncidente('${inc.id}', 'fechaHora', this.value)">
      </td>
    </tr>
  `;
}

function renderIncGeoIndicator(inc) {
  // Indicador discreto del estado de georreferenciación: pill chico en la celda de comunas
  if (inc.geocodeStatus === 'searching') {
    return `<span class="inc-geo-indicator inc-geo-loading" title="Buscando ubicación…"><span class="spinner"></span></span>`;
  }
  if (inc.geocoded && inc.lat != null) {
    return `<span class="inc-geo-indicator inc-geo-ok" onclick="flyToIncidente('${inc.id}')" title="Ubicado: ${inc.lat.toFixed(4)}, ${inc.lng.toFixed(4)} · clic para ver en mapa">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
    </span>`;
  }
  if (inc.geocodeStatus === 'manual' && inc.lat != null) {
    return `<span class="inc-geo-indicator inc-geo-manual" onclick="flyToIncidente('${inc.id}')" title="Ubicación manual o aproximada · clic para ver en mapa">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="10" r="3"></circle><path d="M12 2a8 8 0 0 0-8 8c0 5.4 8 12 8 12s8-6.6 8-12a8 8 0 0 0-8-8z"></path></svg>
    </span>`;
  }
  if (inc.geocodeStatus === 'failed') {
    return `<span class="inc-geo-indicator inc-geo-warn" onclick="manualLocateIncidente('${inc.id}')" title="No fue ubicable · clic para fijar manualmente en el mapa">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
    </span>`;
  }
  return '';
}

function renderIncComunasMultiselect(inc) {
  const selected = inc.comunas || [];
  const allSelected = selected.length === COMUNAS.length;
  const noneSelected = selected.length === 0;

  let displayHtml;
  if (noneSelected) {
    displayHtml = `<span class="multiselect-display placeholder">— Seleccionar comuna(s) —</span>`;
  } else if (allSelected) {
    displayHtml = `<span class="regional-badge" style="background: ${inc.color};">Regional</span>`;
  } else {
    displayHtml = selected.map(c => `<span class="comuna-tag" style="background: ${inc.color}22; color: ${inc.color}; border: 1px solid ${inc.color}55;">${escapeHtml(c)}</span>`).join('');
  }

  const optionsHtml = COMUNAS.map(c => {
    const isSel = selected.includes(c.name);
    return `
      <label class="multiselect-option ${isSel ? 'selected' : ''}" onclick="event.stopPropagation();">
        <input type="checkbox" ${isSel ? 'checked' : ''} onchange="toggleIncComuna('${inc.id}', '${escapeAttr(c.name)}', this.checked)">
        <span>${escapeHtml(c.name)}</span>
        <span class="opt-prov">${escapeHtml(c.prov)}</span>
      </label>
    `;
  }).join('');

  return `
    <div class="multiselect inc-multiselect" data-inc-id="${inc.id}">
      <button type="button" class="multiselect-trigger" onclick="toggleIncMenu(event, '${inc.id}')">
        <div class="multiselect-display">${displayHtml}</div>
        <svg class="multiselect-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </button>
      <div class="multiselect-menu">
        <div class="multiselect-menu-header">
          <span>${selected.length} de ${COMUNAS.length} seleccionadas</span>
          <div>
            <button type="button" onclick="selectAllIncComunas('${inc.id}')">Todas</button>
            <button type="button" onclick="clearAllIncComunas('${inc.id}')">Ninguna</button>
          </div>
        </div>
        <div class="multiselect-options">${optionsHtml}</div>
      </div>
    </div>
  `;
}

function toggleIncMenu(e, incId) {
  e.stopPropagation();
  document.querySelectorAll('.inc-multiselect.open').forEach(el => {
    if (el.dataset.incId !== incId) {
      el.classList.remove('open');
      el.querySelector('.multiselect-trigger')?.classList.remove('open');
    }
  });
  const ms = document.querySelector(`.inc-multiselect[data-inc-id="${incId}"]`);
  if (!ms) return;
  ms.classList.toggle('open');
  ms.querySelector('.multiselect-trigger').classList.toggle('open', ms.classList.contains('open'));
}

document.addEventListener('click', (e) => {
  document.querySelectorAll('.inc-multiselect.open').forEach(ms => {
    if (!ms.contains(e.target)) {
      ms.classList.remove('open');
      ms.querySelector('.multiselect-trigger')?.classList.remove('open');
    }
  });
});

function toggleIncComuna(incId, name, checked) {
  const inc = getIncidente(incId);
  if (!inc) return;
  const idx = inc.comunas.indexOf(name);
  if (checked && idx === -1) inc.comunas.push(name);
  if (!checked && idx !== -1) inc.comunas.splice(idx, 1);
  saveSitrep();
  refreshIncidentesMatrix();
  scheduleGeocodeIncidente(incId);
}

function selectAllIncComunas(incId) {
  const inc = getIncidente(incId);
  if (!inc) return;
  inc.comunas = COMUNAS.map(c => c.name);
  saveSitrep();
  refreshIncidentesMatrix();
  scheduleGeocodeIncidente(incId);
}

function clearAllIncComunas(incId) {
  const inc = getIncidente(incId);
  if (!inc) return;
  inc.comunas = [];
  inc.lat = null;
  inc.lng = null;
  inc.geocoded = false;
  inc.geocodeStatus = '';
  saveSitrep();
  refreshIncidentesMatrix();
  renderMarkers();
}

function updateIncidente(incId, field, value) {
  const inc = getIncidente(incId);
  if (!inc) return;
  inc[field] = value;
  saveSitrep();
  if (field === 'sector') scheduleGeocodeIncidente(incId);
  updateProgress();
}

// ============================================================
// GEOCODIFICACIÓN POR INCIDENTE
// ============================================================
const geocodeTimers = {};

function scheduleGeocodeIncidente(incId) {
  clearTimeout(geocodeTimers[incId]);
  geocodeTimers[incId] = setTimeout(() => geocodeIncidente(incId, false), 1200);
}

// Sistema de geocodificación robusto con múltiples proveedores y fallback automático
// Detecta entorno (file:// vs http://) y elige la estrategia que funcione.
const GEOCODE_PROVIDERS_STATE = {
  isFileProtocol: typeof window !== 'undefined' && window.location && window.location.protocol === 'file:',
  warned: false,
  // Cache de respuestas para no consultar lo mismo dos veces
  cache: new Map()
};

// Proveedor 1: Photon (Komoot) — Tiene CORS abierto y funciona desde file://
async function geocodeWithPhoton(query) {
  // Bounding box de Los Ríos: minLon, minLat, maxLon, maxLat
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1&lang=es&bbox=-73.8,-40.8,-71.8,-39.2`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('photon http ' + resp.status);
  const data = await resp.json();
  if (!data.features || data.features.length === 0) throw new Error('photon sin resultados');
  const feat = data.features[0];
  const [lng, lat] = feat.geometry.coordinates;
  return { lat, lng, source: 'Photon' };
}

// Proveedor 2: Nominatim directo de OpenStreetMap
async function geocodeWithNominatim(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=es&countrycodes=cl&q=${encodeURIComponent(query)}`;
  const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!resp.ok) throw new Error('nominatim http ' + resp.status);
  const results = await resp.json();
  if (!results || results.length === 0) throw new Error('nominatim sin resultados');
  return {
    lat: parseFloat(results[0].lat),
    lng: parseFloat(results[0].lon),
    source: 'Nominatim'
  };
}

// Proveedor 3: Nominatim via JSONP (compatible con file://)
function geocodeWithNominatimJSONP(query) {
  return new Promise((resolve, reject) => {
    const cb = 'nomCb_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('jsonp timeout'));
    }, 8000);
    function cleanup() {
      try { delete window[cb]; } catch (e) { window[cb] = undefined; }
      const s = document.getElementById(cb);
      if (s) s.parentNode.removeChild(s);
      clearTimeout(timeout);
    }
    window[cb] = function(results) {
      cleanup();
      if (!results || results.length === 0) return reject(new Error('jsonp sin resultados'));
      resolve({
        lat: parseFloat(results[0].lat),
        lng: parseFloat(results[0].lon),
        source: 'Nominatim (JSONP)'
      });
    };
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=es&countrycodes=cl&q=${encodeURIComponent(query)}&json_callback=${cb}`;
    const script = document.createElement('script');
    script.id = cb;
    script.src = url;
    script.onerror = () => { cleanup(); reject(new Error('jsonp network error')); };
    document.head.appendChild(script);
  });
}

// Función orquestadora: intenta los proveedores en orden hasta que uno funcione
async function geocodeQuery(query) {
  // Cache hit
  if (GEOCODE_PROVIDERS_STATE.cache.has(query)) {
    return GEOCODE_PROVIDERS_STATE.cache.get(query);
  }

  const errors = [];
  // Estrategia diferenciada según entorno
  const providers = GEOCODE_PROVIDERS_STATE.isFileProtocol
    ? [
        { name: 'Photon',          fn: () => geocodeWithPhoton(query) },
        { name: 'Nominatim JSONP', fn: () => geocodeWithNominatimJSONP(query) },
        { name: 'Nominatim',       fn: () => geocodeWithNominatim(query) }
      ]
    : [
        { name: 'Photon',          fn: () => geocodeWithPhoton(query) },
        { name: 'Nominatim',       fn: () => geocodeWithNominatim(query) },
        { name: 'Nominatim JSONP', fn: () => geocodeWithNominatimJSONP(query) }
      ];

  for (const provider of providers) {
    try {
      const result = await provider.fn();
      GEOCODE_PROVIDERS_STATE.cache.set(query, result);
      return result;
    } catch (err) {
      errors.push(provider.name + ': ' + err.message);
      // Continuar con siguiente proveedor
    }
  }

  const error = new Error('Todos los geocodificadores fallaron: ' + errors.join(' | '));
  error.allFailed = true;
  throw error;
}

async function geocodeIncidente(incId, userTriggered) {
  const inc = getIncidente(incId);
  if (!inc) return;
  const comunas = inc.comunas || [];
  const sector = (inc.sector || '').trim();

  // Sin nada → limpiar
  if (comunas.length === 0 && !sector) {
    inc.lat = null; inc.lng = null; inc.geocoded = false; inc.geocodeStatus = '';
    saveSitrep();
    refreshIncidentesMatrix();
    renderMarkers();
    return;
  }

  // Sin sector → usar centroide de la primera comuna (sin marcar como geocoded preciso)
  if (!sector && comunas.length > 0) {
    const c = COMUNAS.find(x => x.name === comunas[0]);
    if (c) {
      inc.lat = c.lat;
      inc.lng = c.lng;
      inc.geocoded = false;
      inc.geocodeStatus = 'manual';
    }
    saveSitrep();
    refreshIncidentesMatrix();
    renderMarkers();
    if (comunas.length === 1 && map) map.flyTo([c.lat, c.lng], 11, { duration: 0.5 });
    return;
  }

  // Sector sin comuna → error visible
  if (comunas.length === 0 && sector) {
    inc.geocodeStatus = 'failed';
    inc.geocoded = false;
    saveSitrep();
    refreshIncidentesMatrix();
    return;
  }

  // Sector + comuna(s) → geocodificar
  const comunaName = comunas[0];
  const comunaObj = COMUNAS.find(x => x.name === comunaName);
  const query = `${sector}, ${comunaName}, Región de Los Ríos, Chile`;
  inc.geocodeStatus = 'searching';
  refreshIncidentesMatrix();

  try {
    const result = await geocodeQuery(query);
    const { lat, lng } = result;
    const inRegion = lat >= -40.8 && lat <= -39.2 && lng >= -73.8 && lng <= -71.8;

    if (!inRegion) {
      // Fuera de Los Ríos → caer al centroide de la comuna
      if (comunaObj) {
        inc.lat = comunaObj.lat;
        inc.lng = comunaObj.lng;
        inc.geocodeStatus = 'manual';
        inc.geocoded = false;
      } else {
        inc.geocodeStatus = 'failed';
        inc.geocoded = false;
      }
      saveSitrep();
      refreshIncidentesMatrix();
      renderMarkers();
      if (userTriggered) showToast('Resultado fuera de Los Ríos. Usando centroide de la comuna.', 'error');
      return;
    }

    inc.lat = lat;
    inc.lng = lng;
    inc.geocoded = true;
    inc.geocodeStatus = 'ok';
    saveSitrep();
    refreshIncidentesMatrix();
    renderMarkers();
    if (map && userTriggered) map.flyTo([lat, lng], 14, { duration: 0.6 });
  } catch (err) {
    console.warn('Geocode falló incidente', incId, err);

    // Si todos los proveedores fallaron, advertir al usuario (solo una vez)
    if (err.allFailed && !GEOCODE_PROVIDERS_STATE.warned) {
      GEOCODE_PROVIDERS_STATE.warned = true;
      if (GEOCODE_PROVIDERS_STATE.isFileProtocol) {
        showGeocodeBlockedNotice();
      } else {
        showToast('Servicio de geocodificación no disponible. Usando ubicación aproximada de la comuna.', 'error');
      }
    }

    // Fallback final: ubicar al centroide de la comuna (mejor que nada)
    if (comunaObj) {
      inc.lat = comunaObj.lat;
      inc.lng = comunaObj.lng;
      inc.geocoded = false;
      inc.geocodeStatus = 'manual';
    } else {
      inc.geocodeStatus = 'failed';
      inc.geocoded = false;
    }
    saveSitrep();
    refreshIncidentesMatrix();
    renderMarkers();
  }
}

// Aviso modal informativo cuando se detecta entorno file:// y todos los proveedores fallan
function showGeocodeBlockedNotice() {
  const existing = document.getElementById('geocode-blocked-modal');
  if (existing) return;
  const modal = document.createElement('div');
  modal.id = 'geocode-blocked-modal';
  modal.className = 'modal-overlay visible';
  modal.innerHTML = `
    <div class="modal" style="max-width: 540px;">
      <div class="modal-header" style="background: linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%); border-bottom: 1px solid #FCD34D;">
        <h2 style="color: #92400E; display: flex; align-items: center; gap: 8px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          Geocodificación no disponible
        </h2>
        <p style="color: #92400E; margin-top: 4px;">Detectamos que el archivo se está ejecutando localmente</p>
      </div>
      <div class="modal-body" style="font-size: 13px; line-height: 1.55;">
        <p style="margin-bottom: 12px;">El navegador está bloqueando las consultas al servicio de mapas porque el archivo se abrió directamente desde el disco (<code style="background: #F4F3EE; padding: 1px 6px; border-radius: 3px; font-size: 11.5px;">file://</code>) en lugar de un servidor web.</p>
        <p style="margin-bottom: 8px;"><strong>Mientras tanto, la aplicación sigue siendo plenamente funcional:</strong></p>
        <ul style="margin: 0 0 14px 18px; color: var(--text-muted);">
          <li>Los incidentes se ubican automáticamente al <strong>centroide de la comuna</strong> seleccionada.</li>
          <li>Puede afinar la ubicación con clic en el ícono ⚠ de cada fila o con <strong>"+ Agregar punto"</strong>.</li>
          <li>El formulario, descarga PDF y guardado funcionan normalmente.</li>
        </ul>
        <p style="margin-bottom: 8px;"><strong>Para activar la geocodificación automática:</strong></p>
        <p style="margin-bottom: 6px; color: var(--text-muted);">Suba el archivo a un servidor (Netlify Drop tarda 30 segundos en <a href="https://app.netlify.com/drop" target="_blank" style="color: var(--accent);">app.netlify.com/drop</a>) o solicite a su equipo TI publicar el archivo en la intranet institucional.</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" onclick="document.getElementById('geocode-blocked-modal').remove()" style="background: var(--navy);">Entendido</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}
