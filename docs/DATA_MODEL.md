# Modelo de datos

Cada SITREP es un objeto JavaScript con el siguiente esquema. Se persiste en `localStorage` bajo la clave `sitrep_los_rios_v1` dentro de un diccionario `{ sitreps: { id: data }, currentId }`.

## Esquema raíz

```js
{
  id: "SITREP-2026-001",       // string, inmutable, formato SITREP-AAAA-NNN
  createdAt: ISO-8601,         // string
  updatedAt: ISO-8601,         // string, actualizado en cada save
  status: "Borrador",          // "Borrador" | "Emitido" | "Cierre"

  identificacion: { ... },     // Punto 1
  resumen:        { ... },     // Punto 2
  situacion:      { ... },     // Punto 3
  afectacion:     [ ... ],     // Punto 4
  servicios:      [ ... ],     // Punto 5
  acciones:       [ ... ],     // Punto 6
  brechas:        [ ... ],     // Punto 7
  prioridades:    [ ... ],     // Punto 8
  proximas:       [ ... ],     // Punto 9
  fuentes:        [ ... ],     // Punto 10
  observaciones:  "",          // Punto 11
  distribucion:   [ ... ],     // Punto 12
  validacion:     { ... },     // Punto 13

  markers: [ ... ]             // Pines manuales adicionales del mapa
}
```

## Punto 1: identificación

```js
identificacion: {
  tipoReporte: "Preliminar",   // "Preliminar" | "Ampliación" | "Cierre"
  nombreEvento: "",
  tipoAmenaza: "",             // ver TIPOS_AMENAZA en config/constants
  incidentes: [
    {
      id: "inc_...",
      comunas: ["Valdivia", ...],  // array de nombres oficiales
      sector: "",                  // texto libre
      fechaHora: "",               // datetime-local ISO
      color: "#DC2626",            // de INCIDENT_COLORS
      lat: -39.81,                 // null si no ubicado
      lng: -73.24,                 // null si no ubicado
      geocoded: true,              // true=ubicación exacta, false=aprox
      geocodeStatus: "ok"          // "ok" | "searching" | "failed" | "manual"
    }
  ],
  periodoDesde: "",            // datetime-local
  periodoHasta: "",
  horaCorte: "",
  fechaEmision: "",
  proximoSitrep: "",
  responsable: "",
  fuentesPrincipales: ""       // auto-consolidado desde afectacion[].fuente
}
```

## Punto 2: resumen

```js
resumen: {
  general: "",                  // texto, puede ser auto-generado o manual
  porComuna: {                  // un texto por cada comuna registrada
    "Valdivia": "...",
    "Panguipulli": "..."
  },
  generalEditado: false         // flag: si true, no se sobrescribe en auto-redacción
}
```

## Punto 3: situación actual general

```js
situacion: {
  evolucion: "",               // "Aumenta" | "Se mantiene" | "Disminuye" | "En evaluación"
  descripcionTecnica: "",
  comunasAfectadas: "",        // "Proyección de avance..."
  poblacionExpuesta: "",
  infraestructura: "",
  serviciosAfectados: "",
  comunidadesAisladas: ""
}
```

## Punto 4: afectación territorial (array)

```js
afectacion: [
  {
    comuna: "Valdivia",        // select de las 12
    sector: "",
    afectacionReporte: "",
    personas: "12",            // string para permitir "+50", "≈30"
    viviendas: "5",            // ídem
    estado: "Preliminar",      // ESTADO_DATO
    fuente: "Municipio",       // alimenta consolidación del Punto 1
    hora: "14:30"              // HH:MM
  }
]
```

## Punto 5: servicios críticos (array)

```js
servicios: [
  {
    servicio: "Energía eléctrica",  // si pertenece a SERVICIOS_CLIENTES, la unidad es "clientes"
    estado: "",                     // "Operativo" | "Operativo parcial" | "Interrumpido" | "En evaluación"
    comunas: [...],                 // multiselect, [] = ninguna, length===12 → "Regional"
    poblacion: "",                  // número, etiqueta dinámica
    accion: "",
    responsable: "Empresa / SEC",
    fechaHora: "",                  // datetime-local
    observacion: ""
  }
]
```

## Punto 6: acciones ejecutadas (array)

```js
acciones: [
  { accion, institucion, lugar, estado, hora, observacion }
]
```

## Punto 7: brechas y necesidades (array)

```js
brechas: [
  {
    brecha, lugar, impacto, requerimiento, responsable,
    prioridad: "Alta" | "Media" | "Baja"
  }
]
```

## Punto 8: prioridades (array fijo de 6 strings)

```js
prioridades: ["", "", "", "", "", ""]
```

## Punto 9: próximas acciones (array)

```js
proximas: [
  { accion, responsable, plazo, producto }
]
```

## Punto 10: fuentes (array)

```js
fuentes: [
  { fuente, info, estado, hora }
]
```

## Punto 11: observaciones (string)

```js
observaciones: ""
```

## Punto 12: distribución (array)

```js
distribucion: [
  { destinatario, cargo, hora }
]
```

## Punto 13: validación

```js
validacion: {
  elabNombre, elabCargo, elabFecha,
  revNombre,  revCargo,  revFecha
}
```

## Markers adicionales (no asociados a incidentes)

```js
markers: [
  { id, lat, lng, label, auto: false }
]
```

## Reglas de integridad

1. **`id` es inmutable** una vez creado. Se genera con `getNextSitrepNumber()`.
2. **Migraciones aditivas:** ver `MIGRATIONS.md`. Nunca renombrar ni borrar campos.
3. **Arrays vacíos en vez de null** para campos repetidos.
4. **Strings vacíos en vez de null** para campos de texto.
5. **`comunas` siempre como array** desde v1.0 (antes era string CSV).
6. **`fuentesPrincipales` es derivado** — no editar directamente; se recalcula desde `afectacion[].fuente`.
