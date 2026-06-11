# SITREP Los Ríos

> Sistema Regional de Reporte de Situación — SINAPRED / COGRID Región de Los Ríos

Aplicación web para la elaboración de Reportes de Situación (SITREP) en contextos de emergencia, desastre o monitoreo reforzado de amenazas en la Región de Los Ríos, Chile. Compatible con el marco SINAPRED/COGRID y la Ley N° 21.364.

## Características principales

- **13 secciones estructuradas** que cumplen con el estándar SITREP del Manual Práctico de la Región de Los Ríos
- **Numeración correlativa** automática e inmutable (`SITREP-AAAA-NNN`)
- **Matriz de incidentes** con georreferenciación automática vía OpenStreetMap (Photon + Nominatim con fallback)
- **Multiselect de las 12 comunas** de la región con badge automático "REGIONAL"
- **Servicios críticos** con unidad dinámica (clientes / personas según servicio)
- **Resumen ejecutivo** que se redacta automáticamente desde las descripciones por comuna
- **Consolidación automática de fuentes** desde la tabla de afectación territorial
- **Mapa interactivo** Leaflet con modo pantalla completa
- **Generación de PDF** con formato institucional
- **Persistencia local** en `localStorage` con import/export JSON
- **Auto-guardado** continuo
- **PWA instalable** en Windows, macOS, Linux, iOS, Android
- **Funcional offline** después de la primera carga

## Stack técnico

- **Frontend:** HTML5 + CSS3 + JavaScript vanilla (sin framework)
- **Mapas:** Leaflet 1.9.4
- **Geocodificación:** Photon (Komoot) + Nominatim (OpenStreetMap) con fallback automático
- **PDF:** html2pdf.js
- **Tipografía:** IBM Plex Sans/Mono
- **Storage:** localStorage del navegador
- **Build:** sin bundler — los archivos se concatenan en `dist/SITREP_Maquina_LosRios.html` mediante `npm run build`

## Inicio rápido

```bash
# Instalar dependencias de desarrollo (solo servidor local)
npm install

# Servir en desarrollo (http://localhost:8080)
npm run dev

# Construir versión distribuible (un solo archivo HTML)
npm run build

# Validar sintaxis JS y enlaces
npm run check
```

## Estructura del proyecto

```
sitrep-losrios/
├── src/
│   ├── index.html                 Plantilla HTML base
│   ├── styles/                    CSS modular por temática
│   │   ├── tokens.css             Variables CSS, paleta, tipografía
│   │   ├── layout.css             Topbar, sidebar, content, map-panel
│   │   ├── forms.css              Inputs, selects, multiselects
│   │   ├── tables.css             Tablas de datos
│   │   ├── components.css        Modal, toast, badges, botones
│   │   ├── sections.css          Estilos específicos por sección
│   │   ├── map.css               Mapa, pins, fullscreen
│   │   └── pdf.css               Estilos del template PDF
│   └── scripts/
│       ├── config/
│       │   ├── comunas.js        Las 12 comunas de Los Ríos
│       │   ├── colors.js         Paleta para incidentes
│       │   └── constants.js      Tipos de amenaza, estados, prioridades
│       ├── core/
│       │   ├── state.js          Estado global y modelo de datos
│       │   ├── storage.js        localStorage + migraciones
│       │   ├── lifecycle.js      init, createNewSitrep, loadSitrep
│       │   └── progress.js       Cálculo de progreso por sección
│       ├── sections/
│       │   ├── identificacion.js  Punto 1
│       │   ├── resumen.js         Punto 2 (con auto-redacción)
│       │   ├── situacion.js       Punto 3
│       │   ├── afectacion.js      Punto 4
│       │   ├── servicios.js       Punto 5
│       │   ├── acciones.js        Punto 6
│       │   ├── brechas.js         Punto 7
│       │   ├── prioridades.js     Punto 8
│       │   ├── proximas.js        Punto 9
│       │   ├── fuentes.js         Punto 10
│       │   ├── observaciones.js   Punto 11
│       │   ├── distribucion.js    Punto 12
│       │   └── validacion.js      Punto 13
│       ├── services/
│       │   ├── geocoding.js      Photon + Nominatim + JSONP
│       │   ├── map.js            Leaflet, markers, fullscreen
│       │   └── pdf.js            Generación PDF con html2pdf
│       └── utils/
│           ├── dom.js            Helpers de DOM
│           ├── escape.js         escapeHtml, escapeAttr
│           └── format.js         Fechas, números
├── public/
│   ├── icons/                    Íconos PWA (192, 512, maskable)
│   ├── manifest.json             Manifest PWA
│   └── service-worker.js         Cache offline
├── docs/
│   ├── ARCHITECTURE.md           Arquitectura técnica
│   ├── DATA_MODEL.md             Esquema del SITREP
│   ├── DEPLOYMENT.md             Cómo desplegar
│   └── MIGRATIONS.md             Historial de migraciones de datos
├── tools/
│   └── build.js                  Concatena src/* en dist/
├── dist/                         Output del build (.html monolítico)
├── package.json
├── CLAUDE.md                     Guía para asistente IA
├── CHANGELOG.md                  Historial de versiones
└── README.md
```

## Modelo de datos

Cada SITREP es un objeto JSON con esta forma resumida:

```js
{
  id: "SITREP-2026-001",
  createdAt: "2026-05-17T...",
  updatedAt: "2026-05-17T...",
  status: "Borrador" | "Emitido" | "Cierre",

  identificacion: {
    tipoReporte, nombreEvento, tipoAmenaza,
    incidentes: [{ id, comunas: [], sector, fechaHora, color, lat, lng, geocoded, geocodeStatus }],
    periodoDesde, periodoHasta, horaCorte, fechaEmision, proximoSitrep,
    responsable, fuentesPrincipales  // auto-consolidado desde afectación
  },

  resumen: {
    general,                       // auto-redactado, editable
    porComuna: { "Valdivia": "...", "Panguipulli": "..." },
    generalEditado: false          // flag: el usuario lo editó manualmente
  },

  situacion: { evolucion, descripcionTecnica, comunasAfectadas, ... },
  afectacion: [{ comuna, sector, afectacionReporte, personas, viviendas, estado, fuente, hora }],
  servicios:  [{ servicio, estado, comunas: [], poblacion, accion, responsable, fechaHora, observacion }],
  acciones:   [{ accion, institucion, lugar, estado, hora, observacion }],
  brechas:    [{ brecha, lugar, impacto, requerimiento, responsable, prioridad }],
  prioridades: ['', '', '', '', '', ''],
  proximas:    [{ accion, responsable, plazo, producto }],
  fuentes:     [{ fuente, info, estado, hora }],
  observaciones,
  distribucion: [{ destinatario, cargo, hora }],
  validacion:   { elabNombre, elabCargo, elabFecha, revNombre, revCargo, revFecha },
  markers:      [{ id, lat, lng, label, auto }]  // pines manuales adicionales
}
```

Ver `docs/DATA_MODEL.md` para detalle completo.

## Despliegue

Tres opciones soportadas, en orden de complejidad:

1. **Archivo único** (`dist/SITREP_Maquina_LosRios.html`) — Abrir directamente
2. **Netlify Drop** — Arrastrar el archivo a https://app.netlify.com/drop
3. **PWA instalable** — Servir desde HTTPS, el usuario instala desde el navegador

Ver `docs/DEPLOYMENT.md` para detalle.

## Licencia

Propiedad institucional — SENAPRED Región de Los Ríos.

## Referencias técnicas

- Manual Práctico SITREP, Región de Los Ríos (abril 2026)
- Ley N° 21.364 que establece el Sistema Nacional de Prevención y Respuesta ante Desastres
- FEMA, National Incident Management System
- OCHA, Situation Reports
