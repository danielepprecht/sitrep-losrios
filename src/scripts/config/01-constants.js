// ==========================================================================
// config/constants.js — Configuración estática de la región
// ==========================================================================
// ============================================================
// COMUNAS DE LA REGIÓN DE LOS RÍOS
// ============================================================
const COMUNAS = [
  { name: 'Valdivia',     lat: -39.8142, lng: -73.2459, prov: 'Valdivia' },
  { name: 'Corral',       lat: -39.8867, lng: -73.4319, prov: 'Valdivia' },
  { name: 'Lanco',        lat: -39.4506, lng: -72.7706, prov: 'Valdivia' },
  { name: 'Los Lagos',    lat: -39.8511, lng: -72.8344, prov: 'Valdivia' },
  { name: 'Máfil',        lat: -39.6500, lng: -72.9500, prov: 'Valdivia' },
  { name: 'Mariquina',    lat: -39.5275, lng: -72.9525, prov: 'Valdivia' },
  { name: 'Paillaco',     lat: -40.0731, lng: -72.8767, prov: 'Valdivia' },
  { name: 'Panguipulli',  lat: -39.6433, lng: -72.3308, prov: 'Valdivia' },
  { name: 'La Unión',     lat: -40.2911, lng: -73.0833, prov: 'Ranco' },
  { name: 'Futrono',      lat: -40.1289, lng: -72.4042, prov: 'Ranco' },
  { name: 'Lago Ranco',   lat: -40.3197, lng: -72.5061, prov: 'Ranco' },
  { name: 'Río Bueno',    lat: -40.3286, lng: -72.9558, prov: 'Ranco' }
];

const COMUNAS_OPTIONS_HTML = `<option value="">— Seleccionar comuna —</option>` +
  COMUNAS.map(c => `<option value="${c.name}">${c.name}</option>`).join('');

// Paleta de colores distinguibles para incidentes
const INCIDENT_COLORS = [
  '#DC2626', // rojo
  '#2563EB', // azul
  '#059669', // verde
  '#D97706', // ámbar
  '#7C3AED', // violeta
  '#DB2777', // rosa
  '#0891B2', // cian
  '#65A30D', // lima
  '#EA580C', // naranja
  '#4338CA', // índigo
  '#BE123C', // carmín
  '#0D9488'  // teal
];

const TIPOS_AMENAZA = [
  'Hidrometeorológica', 'Sísmica/Tsunami', 'Volcánica',
  'Remoción en masa', 'Incendio forestal', 'Incendio estructural',
  'Material peligroso', 'Otra'
];

const ESTADO_DATO = ['Confirmado', 'Preliminar', 'En evaluación', 'Pendiente'];
const PRIORIDADES = ['Alta', 'Media', 'Baja'];

// ============================================================
// ESQUEMA DE SECCIONES
// ============================================================
const SECTIONS = [
  { id: 'identificacion', num: '1', title: 'Identificación del reporte' },
  { id: 'resumen',        num: '2', title: 'Resumen ejecutivo' },
  { id: 'situacion',      num: '3', title: 'Situación actual general' },
  { id: 'afectacion',     num: '4', title: 'Afectación territorial' },
  { id: 'servicios',      num: '5', title: 'Estado de servicios críticos' },
  { id: 'acciones',       num: '6', title: 'Acciones ejecutadas' },
  { id: 'brechas',        num: '7', title: 'Brechas y necesidades' },
  { id: 'prioridades',    num: '8', title: 'Prioridades del próximo período' },
  { id: 'proximas',       num: '9', title: 'Próximas acciones' },
  { id: 'fuentes',        num: '10', title: 'Fuentes de información' },
  { id: 'observaciones',  num: '11', title: 'Observaciones finales' },
  { id: 'distribucion',   num: '12', title: 'Distribución' },
  { id: 'validacion',     num: '13', title: 'Validación' }
];

