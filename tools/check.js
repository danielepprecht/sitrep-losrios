#!/usr/bin/env node
/**
 * tools/check.js
 *
 * Valida el proyecto:
 *   1. Sintaxis JS de cada módulo en src/scripts/
 *   2. Sintaxis del bundle final dist/*.html (si existe)
 *   3. Que el manifest.json sea JSON válido
 *   4. Que existan los íconos referenciados en el manifest
 *
 * Uso:
 *   node tools/check.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const PUBLIC = path.join(ROOT, 'public');

let errors = 0;
let warnings = 0;

function ok(msg)   { console.log(`  ✓ ${msg}`); }
function fail(msg) { console.log(`  ✗ ${msg}`); errors++; }
function warn(msg) { console.log(`  ⚠ ${msg}`); warnings++; }

// =========================================================================
// 1. Cada archivo JS individual: sintaxis
// =========================================================================
console.log('\n[check] Sintaxis JS de módulos:');

function walkJs(dir) {
  if (!fs.existsSync(dir)) return [];
  let result = [];
  fs.readdirSync(dir).forEach(entry => {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) result = result.concat(walkJs(full));
    else if (entry.endsWith('.js')) result.push(full);
  });
  return result;
}

const jsFiles = walkJs(path.join(SRC, 'scripts'));
// Algunos módulos pueden depender de funciones definidas en otros (es vanilla).
// Validamos sintaxis envolviendo en un IIFE para no ejecutar nada.
jsFiles.forEach(f => {
  const code = fs.readFileSync(f, 'utf8');
  try {
    new Function(`(function(){ ${code} })`);
    ok(path.relative(ROOT, f));
  } catch (e) {
    fail(`${path.relative(ROOT, f)} → ${e.message}`);
  }
});

// =========================================================================
// 2. Bundle final (si existe)
// =========================================================================
console.log('\n[check] Bundle final (dist/):');
const bundle = path.join(DIST, 'SITREP_Maquina_LosRios.html');
if (fs.existsSync(bundle)) {
  const html = fs.readFileSync(bundle, 'utf8');
  // Buscar script principal entre <script> sin src
  const scripts = html.match(/<script>([\s\S]*?)<\/script>/g) || [];
  const inline = scripts.filter(s => !s.includes('src='));
  if (inline.length === 0) {
    fail('No se encontró script inline en el bundle');
  } else {
    // El más largo es el del código principal
    const main = inline.reduce((a, b) => a.length > b.length ? a : b).replace(/<\/?script>/g, '');
    try {
      new Function(main);
      ok(`Bundle compila (${(main.length / 1024).toFixed(1)} KB de JS)`);
    } catch (e) {
      fail(`Bundle JS no compila: ${e.message}`);
    }
    ok(`Bundle HTML: ${(html.length / 1024).toFixed(1)} KB total`);
  }
} else {
  warn('dist/SITREP_Maquina_LosRios.html no existe (corre `npm run build` primero)');
}

// =========================================================================
// 3. Manifest PWA
// =========================================================================
console.log('\n[check] PWA:');
const manifestPath = path.join(PUBLIC, 'manifest.json');
if (fs.existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    ok(`manifest.json válido (name: "${manifest.name}")`);
    (manifest.icons || []).forEach(icon => {
      const iconPath = path.join(PUBLIC, icon.src.replace(/^\.\//, ''));
      if (fs.existsSync(iconPath)) ok(`Ícono presente: ${icon.src} (${icon.sizes})`);
      else warn(`Ícono faltante: ${icon.src} → genera con: npm run icons`);
    });
  } catch (e) {
    fail(`manifest.json inválido: ${e.message}`);
  }
} else {
  warn('public/manifest.json no existe');
}

const swPath = path.join(PUBLIC, 'service-worker.js');
if (fs.existsSync(swPath)) {
  const sw = fs.readFileSync(swPath, 'utf8');
  try {
    new Function(sw);
    ok('service-worker.js sintaxis válida');
  } catch (e) {
    fail(`service-worker.js: ${e.message}`);
  }
} else {
  warn('public/service-worker.js no existe');
}

// =========================================================================
// Resumen
// =========================================================================
console.log(`\n[check] ${errors === 0 ? '✓' : '✗'} ${errors} errores, ${warnings} advertencias`);
process.exit(errors > 0 ? 1 : 0);
