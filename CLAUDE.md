# CLAUDE.md — Guía para asistente IA en este proyecto

Este archivo guía cómo Claude Code (u otros asistentes) deben colaborar en el proyecto **SITREP Los Ríos**.

## Contexto del proyecto

Aplicación web para SENAPRED Región de Los Ríos. Permite elaborar Reportes de Situación (SITREP) durante emergencias siguiendo el formato del Manual Práctico de la región y compatible con SINAPRED/COGRID (Ley N° 21.364).

**Usuarios objetivo:**
- Equipo de gestión de información de SENAPRED Regional
- Direcciones comunales de gestión del riesgo
- Servicios sectoriales (MOP, Salud, Educación, SEC, SUBTEL, etc.)
- COGRID Regional

**Contexto operativo:** se usa durante emergencias activas. Esto implica:
- **Confiabilidad sobre features**: una herramienta que falla durante una crisis es peor que ninguna herramienta
- **Funciona sin conexión** después de la primera carga (excepto geocodificación)
- **Bajo ancho de banda**: hay sectores rurales con conexión intermitente
- **Equipos diversos**: desde laptops modernas hasta tablets institucionales antiguas
- **Sesiones largas**: turnos de 8-12 horas, auto-guardado constante crítico

## Principios de diseño

1. **Vanilla JS, sin frameworks.** Cero dependencias de runtime salvo Leaflet y html2pdf (vía CDN). Esto asegura compatibilidad máxima y reduce superficie de fallos.

2. **Distribución como un solo archivo HTML.** El build concatena todos los módulos `src/` en `dist/SITREP_Maquina_LosRios.html`. Un archivo se puede enviar por correo, subir a Drive, abrir desde un USB.

3. **Datos del usuario son sagrados.** El localStorage del navegador es la fuente de verdad. Migraciones siempre preservan información, nunca borran.

4. **Información SIN excepciones.**
   - El número de SITREP es **inmutable** una vez creado
   - Los datos guardados no se pierden al cambiar entre SITREPs
   - Eliminar un SITREP requiere confirmación con modal
   - Las migraciones de modelo son **aditivas**: agregan campos, nunca renombran ni borran

5. **Diseño institucional, no decorativo.**
   - Paleta navy `#1F3864` como color institucional
   - Tipografía IBM Plex (técnica, legible, con gravitas)
   - Cero animaciones gratuitas; las animaciones sirven para feedback funcional
   - Densidad de información alta pero respirable

6. **Estética sobria.** Esta es una herramienta operacional, no un dashboard de venture capital. Evitar: gradientes llamativos, sombras dramáticas, emojis decorativos, microinteracciones lúdicas.

## Convenciones de código

### JavaScript

- **ES2020+** sin transpilación. Compatibilidad con navegadores modernos (Chrome/Edge/Firefox/Safari últimas 2 versiones).
- **Funciones nombradas globales** para que sean invocables desde `onclick=""` y `oninput=""` inline.
- **Estado global en `state`** (objeto único). Helpers `getCurrent()`, `saveSitrep()`.
- **Sin `this`, sin clases.** Funciones puras siempre que sea posible.
- **Nombres en español** para dominio de negocio: `incidentes`, `comunas`, `afectacion`, `brechas`. Nombres en inglés para utilidades técnicas: `escapeHtml`, `geocode`, `render`.
- **JSDoc en funciones públicas** del módulo, especialmente las invocadas desde HTML.

### CSS

- **Variables CSS** declaradas en `:root` en `tokens.css`. Nunca hardcodear colores fuera de tokens.
- **Una carpeta de estilos por preocupación** (`forms.css`, `tables.css`, etc.).
- **Mobile-first** donde aplique, con breakpoints `1024px` y `1280px`.
- **Sin preprocesadores** (Sass, Less, etc.).
- **BEM-light**: `.bloque__elemento--modificador` solo cuando aporta claridad.

### HTML

- **Semántica importa**: `<main>`, `<aside>`, `<section>`, `<nav>`.
- **Roles ARIA** en componentes interactivos custom (multiselects, modales).
- **`type="text"` con `inputmode="numeric"`** en vez de `type="number"` para campos donde el usuario pueda ingresar "aprox 50", "200+", etc.

## Reglas operativas para colaborar en este código

### Cuando agregar un nuevo campo al modelo de datos

1. Agregar el campo en `core/state.js` → `emptySitrep()`.
2. Agregar **migración** en `core/storage.js` → `loadFromStorage()`, que use `if (campo === undefined) campo = valorPorDefecto`.
3. Actualizar el render de la sección correspondiente.
4. Actualizar el PDF si corresponde.
5. Documentar el cambio en `CHANGELOG.md` y `docs/MIGRATIONS.md`.

**NUNCA renombrar un campo existente.** Si necesitas cambiar el nombre semántico, agrega el nuevo y migra el viejo a él, pero deja una nota en `MIGRATIONS.md`.

### Cuando agregar una nueva sección

Cada sección sigue el mismo patrón:
- Un archivo en `src/scripts/sections/<nombre>.js`
- Export de `render<Nombre>(s)` que retorna HTML string
- Add/delete row functions si es tabla dinámica
- Una entrada en el array `SECTIONS` en `core/state.js`
- Una rama en la función `renderSection()` en `core/lifecycle.js`
- Una entrada en `updateProgress()` en `core/progress.js`
- El bloque correspondiente en `services/pdf.js`

### Cuando modificar el flujo de geocodificación

El sistema actual usa **cascada de tres proveedores** con detección de entorno:

1. **Photon (Komoot)** — funciona desde `file://` por su CORS abierto
2. **Nominatim directo** — para entornos servidos por HTTP(S)
3. **Nominatim vía JSONP** — fallback final, evita CORS por completo

Si los tres fallan, se ubica al **centroide de la comuna** (en `config/comunas.js`) y se muestra un modal una vez por sesión.

**No agregar proveedores que requieran API key sin discusión previa.** El proyecto debe ser usable sin gestionar credenciales.

### Cuando trabajar con el mapa

- Leaflet se inicializa una sola vez en `services/map.js`
- Pines de incidentes usan **color por incidente** (no por estado de geocodificación)
- Pines manuales usan letras A, B, C... y color gris para distinguirlos visualmente de incidentes
- El modo fullscreen guarda el `center` y `zoom` previos para restaurar exactamente

### Cuando modificar el PDF

- El PDF se construye como HTML en `services/pdf.js` → `buildPDFHtml(s)` y se renderiza con html2pdf.
- **No reutilizar el CSS del formulario** en el PDF. El PDF tiene su propio set de estilos en `styles/pdf.css` con clase `.pdf-doc` como contenedor.
- Antes de generar el PDF, llamar a `getConsolidatedFuentes(s)` para asegurar que `fuentesPrincipales` esté sincronizado.

## Cosas que SE DEBEN evitar

❌ **Frameworks o bundlers complejos.** Nada de React, Vue, webpack, vite. La simplicidad es feature, no bug.

❌ **APIs de pago o con cuota baja.** Google Maps API, Mapbox sin tier gratuito, OpenAI, etc.

❌ **localStorage como única salvaguarda.** Siempre ofrecer export JSON manual como respaldo.

❌ **Romper SITREPs existentes.** Las migraciones de modelo siempre son aditivas y compatibles hacia atrás.

❌ **Hardcodear las 12 comunas en múltiples lugares.** Vienen de `config/comunas.js`. Punto.

❌ **Texto en inglés en la UI del usuario.** La aplicación es para SENAPRED Chile, español formal.

❌ **Mezclar lógica de presentación con lógica de datos.** Renderizado en `sections/*.js`, datos en `core/state.js`.

❌ **Decir "todo listo" sin probar.** Después de cualquier cambio, validar:
   1. Sintaxis JS con `npm run check`
   2. Que el build genere `dist/*.html` correctamente
   3. Que abrir el HTML resultante no muestre errores en consola (F12)

## Cómo probar cambios

```bash
# Validar sintaxis
npm run check

# Servidor local para probar visualmente
npm run dev
# → abrir http://localhost:8080

# Generar archivo distribuible
npm run build
# → revisar dist/SITREP_Maquina_LosRios.html
```

## Sobre la generación de PDFs en este proyecto

El PDF replica una versión institucional de Word. Reglas:

- Cabecera centrada con identificación del SITREP
- Cada sección con su número y título en navy
- Tablas con header navy + texto blanco
- Tags de comunas con color suave del incidente
- Nota institucional al pie con referencia a Ley 21.364

Ver `docs/PDF_STYLE.md` para guía detallada.

## Referencia operacional del SITREP

Las 13 secciones del formato regional son:

1. Identificación (con matriz de incidentes)
2. Resumen ejecutivo (general + por comuna)
3. Situación actual general
4. Afectación territorial
5. Estado de servicios críticos
6. Acciones ejecutadas
7. Brechas y necesidades
8. Prioridades del próximo período
9. Próximas acciones
10. Fuentes de información
11. Observaciones finales
12. Distribución
13. Validación

Cualquier cambio a la estructura debe **mantener el alineamiento con el Manual Práctico SITREP**. Si una funcionalidad nueva no encaja en estas 13 secciones, conviene revisar si pertenece realmente al SITREP o si es una herramienta complementaria.
