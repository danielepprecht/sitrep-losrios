# Changelog

Todos los cambios notables del proyecto SITREP Los Ríos.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es/1.1.0/)
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] — 2026-06-12

### Características
- Panel de administración: el administrador puede eliminar el perfil de un usuario registrado (botón "Eliminar" por fila)
- Panel de administración: exportar el listado de usuarios a un archivo .csv compatible con Excel ("Exportar Excel")

### Correcciones
- El modal de administración de usuarios ya no queda detrás del panel del mapa (z-index del mapa de Leaflet superaba al de los modales)
- La app ya no se desborda horizontalmente en celulares y tablets (el topbar forzaba un ancho mayor al del viewport)
- Punto 5 (Estado de servicios críticos): el desplegable de "Comunas afectadas" ya no queda recortado por el borde de la tabla y se muestra completo, tanto en filas existentes como en filas agregadas con "Agregar servicio"
- Punto 5: en las últimas 3 filas de la tabla, el desplegable de "Comunas afectadas" se abre hacia arriba en vez de hacia abajo, para que siempre quede visible sin importar cuántos servicios se agreguen
- Se elimina la barra de desplazamiento horizontal que aparecía en pantallas de 769px a 1279px (laptops/tablets en horizontal): los botones del topbar ("Descargar PDF", etc.) ahora se muestran solo con ícono en ese rango, igual que en celulares

## [1.1.0] — 2026-06-12

### Características
- Sistema de cuentas de usuario con Firebase Authentication (correo/contraseña) y recuperación de clave por correo
- Registro de usuario con datos institucionales: nombres, apellidos, RUT (validado con dígito verificador), institución, profesión, cargo, región y comuna de residencia, y teléfono de contacto
- El perfil del usuario autenticado puede precargar el Punto 13 (Validación) mediante el botón "Usar mis datos"
- Cuenta de administrador (`danielepprecht@gmail.com`) con acceso a un listado de todos los usuarios registrados
- Sesión persistente entre dispositivos (móvil, tablet, escritorio) vía Firebase
- Punto 4: "Estado del dato" simplificado a dos opciones: "Confirmado" y "Preliminar / En evaluación"
- Punto 5: el PDF exportado consolida los servicios críticos en una tabla ordenada por servicio y luego por comuna

### Requisitos
- A partir de esta versión, el primer ingreso a la app requiere conexión a internet y una cuenta válida (Firebase Authentication)
- Quien compile el proyecto debe configurar `src/scripts/config/02-firebase-config.js` con los datos del proyecto Firebase antes de ejecutar `npm run build` (ver `docs/DEPLOYMENT.md`)

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
