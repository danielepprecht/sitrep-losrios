# Changelog

Todos los cambios notables del proyecto SITREP Los Ríos.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es/1.1.0/)
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-05-17

### Hito
Primera versión estable lista para uso operativo en SENAPRED Región de Los Ríos.

### Características
- 13 secciones completas del SITREP según Manual Práctico Regional
- Matriz de incidentes con georreferenciación automática
- Multiselect de las 12 comunas con badge "REGIONAL"
- Resumen ejecutivo auto-redactado desde descripciones por comuna
- Consolidación automática de fuentes desde Punto 4
- Servicios críticos con unidad dinámica (clientes/personas)
- Punto 4 con columnas separadas Personas afectadas / Viviendas afectadas
- Punto 5 con fecha y hora de la información por servicio
- Mapa Leaflet con modo pantalla completa
- Sistema multi-proveedor de geocodificación con fallback automático:
  - Photon (Komoot) — primario, funciona en file://
  - Nominatim directo — para servidores HTTP/HTTPS
  - Nominatim JSONP — fallback final
- Detección automática de entorno file:// con aviso amigable
- Generación de PDF con formato institucional
- Auto-guardado continuo en localStorage
- Import/Export JSON
- Manifest PWA y service worker para uso offline
- Numeración correlativa de SITREPs (`SITREP-AAAA-NNN`) inmutable

### Reorganización
- Proyecto reestructurado a módulos en `src/` para mantenibilidad
- Sistema de build con `npm run build`
- Servidor de desarrollo con `npm run dev`
- Validación con `npm run check`

## Historial previo (monolito HTML)

Versiones anteriores se desarrollaron como un solo archivo HTML iterativo,
documentadas mediante conversación con asistente IA. Los hitos principales fueron:

- Estructura SITREP de 13 secciones implementada
- Matriz de incidentes reemplaza campos individuales de comuna/sector/fecha
- Color por incidente con propagación a pines del mapa
- Auto-georreferenciación con Nominatim
- Sistema de fallback multi-proveedor agregado tras detectar bloqueos CORS
- Resumen ejecutivo: redacción automática desde descripciones por comuna
- Botón pantalla completa del mapa
