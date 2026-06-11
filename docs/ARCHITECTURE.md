# Arquitectura

## Visión general

SITREP Los Ríos es una **single-page web application** que se distribuye como un único archivo HTML autocontenido. No tiene backend propio: toda la persistencia ocurre en `localStorage` del navegador. Los servicios externos consumidos son APIs públicas y gratuitas (OpenStreetMap, Photon, Nominatim) que pueden faltar sin romper la app.

```
┌─────────────────────────────────────────────────────────┐
│                  Navegador (cliente)                    │
│                                                         │
│   ┌──────────────┐    ┌──────────────┐                  │
│   │ Vista (HTML/ │    │   Estado     │                  │
│   │  CSS) ←──────┼────┤ (state, JS)  │                  │
│   └──────────────┘    └──────┬───────┘                  │
│                              │                          │
│                       ┌──────▼────────┐                 │
│                       │  localStorage │                 │
│                       └───────────────┘                 │
│                                                         │
│   Servicios externos opcionales:                        │
│   • Photon (Komoot) – geocodificación primaria          │
│   • Nominatim (OSM) – geocodificación de respaldo       │
│   • OpenStreetMap tiles – fondo del mapa                │
└─────────────────────────────────────────────────────────┘
```

## Capas

### 1. Capa de configuración (`src/scripts/config/`)
Datos estáticos del dominio: las 12 comunas con sus coordenadas, paleta de colores de incidentes, listas de opciones (amenazas, prioridades, estados).

### 2. Capa de estado (`src/scripts/core/state.js`)
- `state.sitreps` — diccionario de todos los SITREPs (clave = id correlativo)
- `state.currentId` — qué SITREP se está editando
- `emptySitrep(id)` — constructor del modelo limpio

### 3. Capa de persistencia (`src/scripts/core/storage.js`)
- `loadFromStorage()` — lee localStorage + ejecuta **migraciones** (aditivas, retrocompatibles)
- `saveToStorage()` — escribe localStorage
- `getNextSitrepNumber()` — contador correlativo por año, persistido en clave aparte

### 4. Capa de servicios (`src/scripts/services/`)
- **geocoding.js** — cascada Photon → Nominatim → JSONP, con cache y aviso de bloqueo
- **map.js** — Leaflet, modo fullscreen, pines coloreados por incidente
- **import-export.js** — JSON manual
- **pdf.js** — html2pdf con plantilla institucional

### 5. Capa de secciones (`src/scripts/sections/`)
Una función `renderXxx(s)` por punto del SITREP. Cada una recibe el SITREP actual `s` y retorna HTML string.

### 6. Capa de orquestación (`src/scripts/core/lifecycle.js`, `handlers.js`)
- `renderCurrentSitrep()` — dispatcher principal que invoca cada sección
- `attachListeners()` — adjunta listeners después de cada render
- Handlers de inputs (`onBindInput`, `onTableInput`, etc.)

### 7. Capa de utilidades (`src/scripts/utils/`)
`escapeHtml`, `escapeAttr`, `setByPath`, `showToast`, `showModal`.

## Flujo de un cambio del usuario

```
Usuario escribe en input
      │
      ▼
oninput=update...(value)         ← handler inline
      │
      ▼
state[currentSitrep].campo = value
      │
      ▼
saveSitrep()                     ← debounced 600 ms
      │
      ▼
localStorage.setItem(...)
      │
      ▼
updateProgress() + refrescar UI dependiente
```

## Modelo de datos

Ver `DATA_MODEL.md` para el esquema completo y `MIGRATIONS.md` para el historial de cambios.

## Sistema de geocodificación

Tres proveedores en cascada, en orden adaptado al entorno:

| Entorno  | Orden de fallback                                |
| -------- | ------------------------------------------------ |
| file://  | Photon → Nominatim JSONP → Nominatim directo     |
| http(s)://| Photon → Nominatim directo → Nominatim JSONP    |

Si los tres fallan, se ubica al **centroide de la comuna** y se muestra modal informativo (una vez por sesión).

Diseño en `services/geocoding.js`:
- `geocodeQuery(query)` — función orquestadora
- `geocodeWithPhoton`, `geocodeWithNominatim`, `geocodeWithNominatimJSONP`
- Cache `Map` en memoria para evitar consultas redundantes
- Bounding box de Los Ríos validado antes de aceptar resultado (filtro de falsos positivos)

## Generación de PDF

`services/pdf.js` construye un HTML aparte (`buildPDFHtml(s)`) con su propio set de estilos (`styles/05-pdf.css`, clase contenedor `.pdf-doc`). Se inserta temporalmente en un `<div id="pdf-template">` invisible y se procesa con html2pdf.js. Tras la generación, el template se limpia.

## PWA y modo offline

- **manifest.json** declara metadata, íconos y shortcuts
- **service-worker.js** implementa estrategias diferenciadas:
  - Shell de la app: cache-first
  - CDN (Leaflet, fonts, html2pdf): cache-first con fallback a red
  - Tiles OSM: stale-while-revalidate
  - Geocodificadores (Photon, Nominatim): bypass total (siempre frescos)

## Decisiones de diseño

- **Sin framework de UI.** El proyecto debe funcionar en entornos institucionales heterogéneos sin requerir build pipelines complejos. Vanilla JS minimiza superficie de fallas.
- **Single-file output.** Distribuible por correo, USB, intranet sin servidor.
- **`localStorage` como fuente de verdad.** Suficiente para uso individual; si emerge necesidad multi-usuario se agrega backend sin tocar el frontend salvo capa de sync.
- **Funciones globales (no módulos ES).** Para que `onclick="fn()"` funcione sin overhead.
- **CSS sin preprocesador.** Variables CSS nativas son suficientes y se ejecutan en el navegador.
