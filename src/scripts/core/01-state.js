// ==========================================================================
// core/state.js — Estado global y modelo de datos
// ==========================================================================
// ============================================================
// ESTADO Y ALMACENAMIENTO
// ============================================================
const STORAGE_KEY = 'sitrep_los_rios_v1';
const COUNTER_KEY = 'sitrep_los_rios_counter_v1';

let state = {
  sitreps: {},        // { id: sitrepData }
  currentId: null
};

let map, markersLayer;
let mapMarkers = [];   // [{ id, lat, lng, label, leafletMarker }]
let addMarkerMode = false;

function emptySitrep(id) {
  return {
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    identificacion: {
      tipoReporte: 'Preliminar',
      nombreEvento: '',
      tipoAmenaza: '',
      incidentes: [],
      periodoDesde: '',
      periodoHasta: '',
      horaCorte: '',
      fechaEmision: '',
      proximoSitrep: '',
      responsable: '',
      fuentesPrincipales: ''
    },
    resumen: { general: '', porComuna: {}, generalEditado: false },
    situacion: {
      evolucion: '',
      descripcionTecnica: '',
      comunasAfectadas: '',
      poblacionExpuesta: '',
      infraestructura: '',
      serviciosAfectados: '',
      comunidadesAisladas: ''
    },
    afectacion: [],
    servicios: [
      { servicio: 'Energía eléctrica',     estado: '', comunas: [], poblacion: '', accion: '', responsable: 'Empresa / SEC',         fechaHora: '', observacion: '' },
      { servicio: 'Agua potable / SSR-APR', estado: '', comunas: [], poblacion: '', accion: '', responsable: 'DOH / Municipio',       fechaHora: '', observacion: '' },
      { servicio: 'Telecomunicaciones',     estado: '', comunas: [], poblacion: '', accion: '', responsable: 'SUBTEL / Empresas',     fechaHora: '', observacion: '' },
      { servicio: 'Salud',                  estado: '', comunas: [], poblacion: '', accion: '', responsable: 'SEREMI / Servicio Salud', fechaHora: '', observacion: '' },
      { servicio: 'Educación',              estado: '', comunas: [], poblacion: '', accion: '', responsable: 'SEREMI Educación',      fechaHora: '', observacion: '' },
      { servicio: 'Conectividad vial',      estado: '', comunas: [], poblacion: '', accion: '', responsable: 'MOP / Vialidad',         fechaHora: '', observacion: '' }
    ],
    acciones: [],
    brechas: [],
    prioridades: ['', '', '', '', '', ''],
    proximas: [],
    fuentes: [],
    observaciones: '',
    distribucion: [],
    validacion: {
      elabNombre: '', elabCargo: '', elabFecha: '',
      revNombre: '',  revCargo: '',  revFecha: ''
    },
    markers: [],
    status: 'Borrador'
  };
}

