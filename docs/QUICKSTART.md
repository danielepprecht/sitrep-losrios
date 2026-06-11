# Inicio rápido en Claude Code

Esta guía es para abrir el proyecto en VS Code con Claude Code y empezar a iterar.

## 1. Abrir el proyecto

```bash
cd sitrep-losrios
code .
```

Si tienes la extensión Claude Code instalada, automáticamente leerá:
- `CLAUDE.md` (guía principal para el asistente)
- `README.md` (descripción general)
- `docs/ARCHITECTURE.md` (cómo está construido)
- `docs/DATA_MODEL.md` (qué guarda cada SITREP)

## 2. Comandos esenciales

```bash
# Validar que todo compila
npm run check

# Construir el archivo distribuible
npm run build
# → genera dist/SITREP_Maquina_LosRios.html

# Servidor de desarrollo con auto-reload
npm run dev
# → http://localhost:8080
# → cualquier cambio en src/ reconstruye automáticamente

# Solo previsualizar el bundle ya construido
npm run preview

# Regenerar íconos PWA (si modificas el diseño)
python3 tools/generate-icons.py

# Limpiar build
npm run clean
```

## 3. Estructura para editar

| Necesitas modificar...                     | Edita...                                       |
| ------------------------------------------ | ---------------------------------------------- |
| Las 12 comunas o sus coordenadas           | `src/scripts/config/01-constants.js`           |
| El modelo de datos (campos nuevos)         | `src/scripts/core/01-state.js` + migración en `02-storage.js` |
| Un punto del SITREP                        | `src/scripts/sections/XX-<nombre>.js`          |
| La geocodificación                         | `src/scripts/services/01-geocoding.js`         |
| El mapa                                    | `src/scripts/services/02-map.js`               |
| La generación PDF                          | `src/scripts/services/04-pdf.js`               |
| Los estilos visuales                       | `src/styles/0X-<nombre>.css`                   |
| El HTML del cuerpo (barra superior, mapa) | `src/body.html`                                |
| El template HTML envolvente                | `src/index.html`                               |
| La configuración PWA                       | `public/manifest.json`, `public/service-worker.js` |

## 4. Flujo típico de cambio

1. Hacer la modificación en `src/`
2. `npm run dev` ya tiene la app sirviendo; al guardar el archivo se reconstruye solo
3. Recargar el navegador
4. Si todo OK, antes de cerrar: `npm run check`
5. Documentar en `CHANGELOG.md`

## 5. Patrón para agregar un campo nuevo al modelo

1. **Definir el campo** en `emptySitrep()` (`core/01-state.js`):
   ```js
   miSeccion: {
     // ...
     miCampoNuevo: ''     // ← agregar aquí
   }
   ```

2. **Migración** en `loadFromStorage()` (`core/02-storage.js`):
   ```js
   if (s.miSeccion.miCampoNuevo === undefined) s.miSeccion.miCampoNuevo = '';
   ```

3. **Render** del input en la sección correspondiente:
   ```js
   <input data-bind="miSeccion.miCampoNuevo" value="${escapeAttr(x.miCampoNuevo)}">
   ```

4. **Progress** si es relevante para completitud (`core/05-progress.js`)

5. **PDF** si debe aparecer en la salida (`services/04-pdf.js`)

6. **Documentar** en `CHANGELOG.md` y `docs/MIGRATIONS.md`

## 6. Patrón para agregar un proveedor de geocodificación

Editar `src/scripts/services/01-geocoding.js`:

```js
async function geocodeWithMiProveedor(query) {
  const url = `https://mi-proveedor.com/search?q=${encodeURIComponent(query)}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('mi-proveedor http ' + resp.status);
  const data = await resp.json();
  if (!data || data.length === 0) throw new Error('mi-proveedor sin resultados');
  return {
    lat: data[0].lat,
    lng: data[0].lng,
    source: 'MiProveedor'
  };
}
```

Y agregarlo al orden en `geocodeQuery()`.

## 7. Debugging

- **Errores en consola del navegador (F12)** son lo primero a revisar.
- **`state` está en el objeto global** — abre la consola y escribe `state` para inspeccionar.
- **Datos guardados en `localStorage`** — DevTools → Application → Local Storage → ver clave `sitrep_los_rios_v1`.
- **Exportar JSON** para análisis externo con el botón "JSON" de la barra superior.
- **Geocodificación no funciona** — abre consola y busca errores CORS o fetch fallidos. Ver `docs/ARCHITECTURE.md` sección de geocodificación.

## 8. Antes de un commit/release

```bash
npm run check          # debe terminar en "0 errores"
npm run build          # debe generar dist/ sin warnings
# Probar manualmente:
#   - crear un SITREP nuevo
#   - llenar al menos identificación, resumen, afectación
#   - descargar PDF
#   - recargar la página → debe persistir
```

Actualizar:
- `CHANGELOG.md` con el resumen del cambio
- `package.json` versión si aplica
- `docs/MIGRATIONS.md` si tocaste el modelo
