// ==========================================================================
// services/map.js — Mapa Leaflet, marcadores, modo pantalla completa
// ==========================================================================

// ============================================================
// MAPA
// ============================================================
function initMap() {
  if (map) return;
  map = L.map('map', {
    center: [-39.85, -72.85],
    zoom: 8,
    zoomControl: true
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 18
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);

  map.on('click', (e) => {
    // Modo de ubicación manual para un incidente específico
    if (manualLocatingIncId) {
      const inc = getIncidente(manualLocatingIncId);
      if (inc) {
        inc.lat = e.latlng.lat;
        inc.lng = e.latlng.lng;
        inc.geocoded = false;
        inc.geocodeStatus = 'manual';
        saveSitrep();
        refreshIncidentesMatrix();
        renderMarkers();
        showToast('Ubicación manual fijada', 'success');
      }
      manualLocatingIncId = null;
      map.getContainer().style.cursor = '';
      return;
    }
    // Modo agregar punto manual genérico (independiente de incidente)
    if (!addMarkerMode) return;
    addMarker(e.latlng.lat, e.latlng.lng, '');
    toggleAddMarkerMode();
  });
}

function toggleAddMarkerMode() {
  addMarkerMode = !addMarkerMode;
  const btn = document.getElementById('add-marker-btn');
  if (addMarkerMode) {
    btn.classList.add('active');
    btn.textContent = '✕ Cancelar';
    map.getContainer().style.cursor = 'crosshair';
  } else {
    btn.classList.remove('active');
    btn.textContent = '+ Agregar punto';
    map.getContainer().style.cursor = '';
  }
}

// Estado pre-fullscreen para poder restaurar
let preFullscreenView = null;
let mapIsFullscreen = false;

function toggleMapFullscreen() {
  const panel = document.getElementById('map-panel');
  if (!panel || !map) return;

  if (!mapIsFullscreen) {
    // Guardar estado actual del mapa para poder restaurarlo
    preFullscreenView = {
      center: map.getCenter(),
      zoom: map.getZoom()
    };
    panel.classList.add('fullscreen');
    document.body.classList.add('map-fullscreen');
    mapIsFullscreen = true;
    updateFullscreenButton();
    // Recalcular tamaño del mapa después de la transición
    setTimeout(() => {
      map.invalidateSize();
      if (preFullscreenView) {
        map.setView(preFullscreenView.center, preFullscreenView.zoom);
      }
    }, 50);
  } else {
    panel.classList.remove('fullscreen');
    document.body.classList.remove('map-fullscreen');
    mapIsFullscreen = false;
    updateFullscreenButton();
    setTimeout(() => {
      map.invalidateSize();
      // Restaurar vista anterior (tamaño y ubicación previos)
      if (preFullscreenView) {
        map.setView(preFullscreenView.center, preFullscreenView.zoom);
        preFullscreenView = null;
      }
    }, 50);
  }
}

function updateFullscreenButton() {
  const expandIcon = document.getElementById('map-expand-icon');
  const collapseIcon = document.getElementById('map-collapse-icon');
  const label = document.getElementById('map-expand-label');
  const btn = document.getElementById('map-expand-btn');
  if (mapIsFullscreen) {
    if (expandIcon) expandIcon.style.display = 'none';
    if (collapseIcon) collapseIcon.style.display = '';
    if (label) label.textContent = 'Restaurar';
    if (btn) btn.title = 'Restaurar tamaño y ubicación originales';
  } else {
    if (expandIcon) expandIcon.style.display = '';
    if (collapseIcon) collapseIcon.style.display = 'none';
    if (label) label.textContent = 'Expandir';
    if (btn) btn.title = 'Pantalla completa';
  }
}

// Cerrar fullscreen con tecla Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && mapIsFullscreen) {
    toggleMapFullscreen();
  }
});

function addMarker(lat, lng, label) {
  const s = getCurrent();
  const id = 'm_' + Date.now();
  const marker = { id, lat, lng, label: label || `Punto ${s.markers.length + 1}` };
  s.markers.push(marker);
  saveSitrep();
  renderMarkers();
}

function renderMarkers() {
  if (!map) return;
  markersLayer.clearLayers();
  mapMarkers = [];

  const s = getCurrent();
  if (!s) return;

  // 1) Marcadores desde los incidentes de la matriz (con color por incidente)
  const incidentes = (s.identificacion && s.identificacion.incidentes) || [];
  incidentes.forEach((inc, idx) => {
    if (inc.lat == null || inc.lng == null) return;
    const color = inc.color || '#1F3864';
    const number = idx + 1;
    const labelMain = (inc.sector || (inc.comunas[0] || 'Incidente')) || '';
    const comunasText = inc.comunas.length === COMUNAS.length
      ? 'Regional'
      : inc.comunas.join(', ');
    const isApprox = !inc.geocoded;

    const icon = L.divIcon({
      className: 'custom-leaflet-marker',
      html: `<div class="inc-pin ${isApprox ? 'inc-pin-approx' : ''}" style="background: ${color};"><span>${number}</span></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28]
    });
    const lm = L.marker([inc.lat, inc.lng], { icon }).addTo(markersLayer);
    lm.bindPopup(`
      <div style="min-width: 180px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <span style="width:12px;height:12px;border-radius:50%;background:${color};display:inline-block;"></span>
          <strong>Incidente #${number}</strong>
        </div>
        ${labelMain ? `<div style="font-size:12px;margin-bottom:4px;"><strong>Sector:</strong> ${escapeHtml(labelMain)}</div>` : ''}
        ${comunasText ? `<div style="font-size:12px;margin-bottom:4px;"><strong>Comuna(s):</strong> ${escapeHtml(comunasText)}</div>` : ''}
        ${inc.fechaHora ? `<div style="font-size:12px;margin-bottom:4px;"><strong>Fecha:</strong> ${new Date(inc.fechaHora).toLocaleString('es-CL')}</div>` : ''}
        <div style="font-family:monospace;font-size:10px;color:#666;margin-top:6px;">${inc.lat.toFixed(4)}, ${inc.lng.toFixed(4)}${isApprox ? ' · ubicación aproximada' : ''}</div>
      </div>
    `);
    mapMarkers.push({ id: 'inc_' + inc.id, leafletMarker: lm });
  });

  // 2) Marcadores manuales genéricos (botón "+ Agregar punto")
  s.markers.forEach((m, idx) => {
    if (m.auto) return; // marcadores legacy auto no se renderizan, ahora los manejan los incidentes
    const icon = L.divIcon({
      className: 'custom-leaflet-marker',
      html: `<div class="custom-marker-icon"><span>${String.fromCharCode(65 + idx)}</span></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 24]
    });
    const lm = L.marker([m.lat, m.lng], { icon }).addTo(markersLayer);
    lm.bindPopup(`<strong>${escapeHtml(m.label)}</strong><br><span style="font-family: monospace; font-size: 10px;">${m.lat.toFixed(4)}, ${m.lng.toFixed(4)}</span>`);
    mapMarkers.push({ id: m.id, leafletMarker: lm });
  });

  // Listado lateral
  const list = document.getElementById('markers-container');
  const manualMarkers = s.markers.filter(m => !m.auto);
  const totalCount = incidentes.filter(x => x.lat != null).length + manualMarkers.length;
  document.getElementById('markers-count').textContent = totalCount;

  if (totalCount === 0) {
    list.innerHTML = '<div class="empty-state" style="padding: 16px;">Sin puntos georreferenciados</div>';
    return;
  }

  let html = '';
  incidentes.forEach((inc, idx) => {
    if (inc.lat == null) return;
    const color = inc.color || '#1F3864';
    const labelMain = inc.sector || inc.comunas[0] || `Incidente ${idx + 1}`;
    html += `
      <div class="marker-item" onclick="flyToIncidente('${inc.id}')">
        <div class="marker-pin" style="background: ${color};"><span>${idx + 1}</span></div>
        <div class="marker-info">
          <div class="marker-info-title">${escapeHtml(labelMain)}</div>
          <div class="marker-info-coords">${inc.lat.toFixed(4)}, ${inc.lng.toFixed(4)}${!inc.geocoded ? ' · aprox.' : ''}</div>
        </div>
      </div>
    `;
  });
  manualMarkers.forEach((m, idx) => {
    html += `
      <div class="marker-item" onclick="flyToMarker('${m.id}')">
        <div class="marker-pin" style="background: var(--text-subtle);"><span>${String.fromCharCode(65 + idx)}</span></div>
        <div class="marker-info">
          <div class="marker-info-title">${escapeHtml(m.label)}</div>
          <div class="marker-info-coords">${m.lat.toFixed(4)}, ${m.lng.toFixed(4)}</div>
        </div>
        <button class="marker-delete" onclick="event.stopPropagation(); deleteMarker('${m.id}')">✕</button>
      </div>
    `;
  });
  list.innerHTML = html;
}

function flyToMarker(id) {
  const s = getCurrent();
  const m = s.markers.find(x => x.id === id);
  if (m && map) {
    map.flyTo([m.lat, m.lng], 13, { duration: 0.7 });
    const mm = mapMarkers.find(x => x.id === id);
    if (mm) mm.leafletMarker.openPopup();
  }
}

function deleteMarker(id) {
  const s = getCurrent();
  s.markers = s.markers.filter(m => m.id !== id);
  saveSitrep();
  renderMarkers();
}
