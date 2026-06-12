# Migraciones de datos

Historial de cambios al modelo de SITREPs guardados en `localStorage`. Las migraciones se ejecutan en `core/storage.js` → `loadFromStorage()` y son **aditivas y retrocompatibles**: nunca borran campos, nunca renombran.

Cuando un SITREP viejo se carga, las migraciones aplicables se ejecutan en orden y el SITREP se persiste actualizado al siguiente save.

## M01 — Comunas como string a array (en identificación)

**Versión:** 1.0.0
**Campo:** `identificacion.comunas`
**Cambio:** de `"Valdivia, Panguipulli"` (string CSV) a `["Valdivia", "Panguipulli"]` (array).
**Trigger:** `typeof s.identificacion.comunas === 'string'`

```js
if (typeof s.identificacion.comunas === 'string') {
  s.identificacion.comunas = s.identificacion.comunas
    ? s.identificacion.comunas.split(',').map(x => x.trim()).filter(Boolean)
    : [];
}
```

## M02 — Campos comuna/sector/fecha individuales a array `incidentes`

**Versión:** 1.0.0
**Cambio estructural:** los campos `identificacion.comunas`, `identificacion.sectorDireccion`, `identificacion.fechaHoraEvento` (uno por SITREP) se reemplazan por `identificacion.incidentes[]`, una colección donde cada elemento es un incidente completo con sus comunas, sector y fecha propios.

**Trigger:** `s.identificacion.incidentes === undefined`

```js
if (s.identificacion.incidentes === undefined) {
  const incidentes = [];
  const oldComunas = s.identificacion.comunas;
  const oldSector = s.identificacion.sectorDireccion || '';
  const oldFecha = s.identificacion.fechaHoraEvento || '';
  // ... convertir a un único incidente si había datos previos
}
```

## M03 — Servicios: comunas string a array, agregar `poblacion`

**Versión:** 1.0.0
**Campos:** `servicios[].comunas`, `servicios[].poblacion`

```js
s.servicios.forEach(row => {
  if (typeof row.comunas === 'string') {
    row.comunas = row.comunas ? row.comunas.split(',').map(x => x.trim()).filter(Boolean) : [];
  }
  if (row.poblacion === undefined) row.poblacion = '';
});
```

## M04 — Servicios: agregar `fechaHora`

**Versión:** 1.0.0
**Campo:** `servicios[].fechaHora`

```js
if (row.fechaHora === undefined) row.fechaHora = '';
```

## M05 — Resumen: string a objeto `{ general, porComuna, generalEditado }`

**Versión:** 1.0.0
**Campo:** `resumen`
**Cambio:** de `"Texto del resumen"` (string) a `{ general: "Texto", porComuna: {}, generalEditado: true }` (objeto).

Si el texto viejo no está vacío, se marca como `generalEditado: true` para que el sistema de auto-redacción NO lo sobrescriba.

```js
if (typeof s.resumen === 'string') {
  s.resumen = { general: s.resumen, porComuna: {}, generalEditado: !!s.resumen };
} else if (s.resumen && typeof s.resumen === 'object') {
  if (s.resumen.general === undefined) s.resumen.general = '';
  if (!s.resumen.porComuna || typeof s.resumen.porComuna !== 'object') s.resumen.porComuna = {};
  if (s.resumen.generalEditado === undefined) {
    s.resumen.generalEditado = !!(s.resumen.general || '').trim();
  }
}
```

## M06 — Afectación: separar personas y viviendas

**Versión:** 1.0.0
**Campo:** `afectacion[].viviendas`
**Cambio:** la columna unificada `personas` (que contenía texto tipo "12 personas / 5 viviendas") se mantiene para personas y se agrega `viviendas` aparte.

```js
s.afectacion.forEach(row => {
  if (row.viviendas === undefined) row.viviendas = '';
});
```

**Nota:** el campo `personas` previo NO se intenta parsear automáticamente. Si un SITREP viejo tenía "12 / 5", queda como "12 / 5" en personas y `viviendas` vacío. El usuario puede ajustarlo manualmente.

## M07 — Validación: trazabilidad de usuario (`elabUid`, `elabCorreo`, `revUid`, `revCorreo`)

**Versión:** 1.1.0
**Campos:** `validacion.elabUid`, `validacion.elabCorreo`, `validacion.revUid`, `validacion.revCorreo`
**Motivo:** con el sistema de cuentas (Firebase Auth), el botón "Usar mis datos" del Punto 13 registra qué usuario autenticado validó el reporte, además del nombre/cargo visibles.
**Trigger:** `s.validacion.elabUid === undefined`

```js
if (s.validacion && s.validacion.elabUid === undefined) {
  s.validacion.elabUid = '';
  s.validacion.elabCorreo = '';
  s.validacion.revUid = '';
  s.validacion.revCorreo = '';
}
```

## Convenciones para futuras migraciones

1. **Numerar** la migración (M08, M09, ...) y agregar al final.
2. **Documentar trigger** explícito (`typeof ... === undefined` o similar).
3. **No borrar campos viejos**. Si un campo se reemplaza, dejar el original y agregar el nuevo. La migración solo lee el viejo y popula el nuevo.
4. **Idempotente**: ejecutar la migración dos veces debe dar el mismo resultado.
5. **No requerir interacción del usuario**. Las migraciones son silenciosas.
6. **Agregar a `loadFromStorage()`** dentro del bloque correspondiente, en el orden cronológico.
