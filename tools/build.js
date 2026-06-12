#!/usr/bin/env node
/**
 * tools/build.js
 *
 * Concatena los archivos modulares de src/ en un único archivo HTML
 * distribuible en dist/SITREP_Maquina_LosRios.html
 *
 * Reglas de orden de concatenación:
 *   CSS:  styles/*.css ordenados alfabéticamente (01-tokens.css, 02-layout.css, ...)
 *   JS:   scripts/config/*.js → scripts/core/*.js → scripts/services/*.js
 *         → scripts/sections/*.js → scripts/utils/*.js
 *
 * El orden importa porque el código es vanilla y depende de funciones globales.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const PUBLIC = path.join(ROOT, 'public');

// Asegurar carpeta dist
if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });

/**
 * Lista archivos de una carpeta ordenados alfabéticamente.
 */
function listSorted(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith(ext))
    .sort()
    .map(f => path.join(dir, f));
}

/**
 * Concatena el contenido de varios archivos separados por separadores legibles.
 */
function concatFiles(files, separator = '\n\n') {
  return files.map(f => {
    const relative = path.relative(ROOT, f);
    const content = fs.readFileSync(f, 'utf8');
    return `/* ===== ${relative} ===== */\n${content}`;
  }).join(separator);
}

// =========================================================================
// 1) Reunir el CSS
// =========================================================================
const cssFiles = listSorted(path.join(SRC, 'styles'), '.css');
console.log(`[build] CSS files: ${cssFiles.length}`);
cssFiles.forEach(f => console.log(`        - ${path.basename(f)}`));
const cssBlob = concatFiles(cssFiles);

// =========================================================================
// 2) Reunir el JavaScript en orden de dependencia
// =========================================================================
const jsOrder = ['config', 'core', 'services', 'sections', 'utils'];
let allJsFiles = [];
jsOrder.forEach(folder => {
  const dir = path.join(SRC, 'scripts', folder);
  const files = listSorted(dir, '.js');
  files.forEach(f => console.log(`        - scripts/${folder}/${path.basename(f)}`));
  allJsFiles = allJsFiles.concat(files);
});
console.log(`[build] JS files: ${allJsFiles.length}`);
const jsBlob = concatFiles(allJsFiles);

// =========================================================================
// 3) Reunir el body HTML
// =========================================================================
const bodyHtml = fs.readFileSync(path.join(SRC, 'body.html'), 'utf8');

// =========================================================================
// 4) Sustituir en el template
// =========================================================================
const template = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');

let output = template
  .replace('/* <!-- BUILD:CSS --> */', cssBlob)
  .replace('<!-- <!-- BUILD:BODY --> -->', bodyHtml)
  .replace('/* <!-- BUILD:JS --> */', jsBlob);

// =========================================================================
// 5) Escribir el resultado
// =========================================================================
const outFile = path.join(DIST, 'SITREP_Maquina_LosRios.html');
fs.writeFileSync(outFile, output, 'utf8');

// =========================================================================
// 6) Copiar archivos PWA al dist
// =========================================================================
const publicFiles = ['manifest.json', 'service-worker.js', '_redirects', 'index.html'];
publicFiles.forEach(f => {
  const src = path.join(PUBLIC, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(DIST, f));
    console.log(`[build] copiado: ${f}`);
  }
});

// Copiar carpeta de íconos PWA
const iconsDir = path.join(PUBLIC, 'icons');
if (fs.existsSync(iconsDir)) {
  const destIcons = path.join(DIST, 'icons');
  if (!fs.existsSync(destIcons)) fs.mkdirSync(destIcons, { recursive: true });
  fs.readdirSync(iconsDir).forEach(icon => {
    fs.copyFileSync(path.join(iconsDir, icon), path.join(destIcons, icon));
  });
  console.log(`[build] copiados íconos PWA`);
}

const stats = fs.statSync(outFile);
const sizeKB = (stats.size / 1024).toFixed(1);
console.log(`\n[build] ✓ ${path.relative(ROOT, outFile)} (${sizeKB} KB)`);
