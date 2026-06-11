#!/usr/bin/env node
/**
 * tools/dev-server.js
 *
 * Servidor HTTP local para desarrollo.
 * - Sirve dist/SITREP_Maquina_LosRios.html como index
 * - Reconstruye automáticamente al detectar cambios en src/
 * - Puerto por defecto: 8080
 *
 * Uso:
 *   node tools/dev-server.js          → sirve y observa cambios
 *   node tools/dev-server.js --dist   → solo sirve, sin watch
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 8080;
const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const SRC = path.join(ROOT, 'src');
const watchMode = !process.argv.includes('--dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon'
};

function build() {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [path.join(__dirname, 'build.js')], { stdio: 'inherit' });
    proc.on('exit', code => code === 0 ? resolve() : reject(new Error('Build falló (' + code + ')')));
  });
}

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/' || urlPath === '') urlPath = '/SITREP_Maquina_LosRios.html';

  const filePath = path.join(DIST, urlPath);
  if (!filePath.startsWith(DIST)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404); res.end('Not found: ' + urlPath); return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

(async function start() {
  console.log('[dev] construyendo proyecto…');
  await build();

  server.listen(PORT, () => {
    console.log(`\n[dev] ➜ http://localhost:${PORT}`);
    console.log('[dev] Ctrl+C para detener\n');
  });

  if (watchMode) {
    let debounce;
    fs.watch(SRC, { recursive: true }, (event, filename) => {
      if (!filename) return;
      clearTimeout(debounce);
      debounce = setTimeout(async () => {
        console.log(`[dev] cambio detectado: ${filename}, reconstruyendo…`);
        try { await build(); console.log('[dev] ✓ rebuild listo'); }
        catch (e) { console.error('[dev] ✗', e.message); }
      }, 200);
    });
    console.log('[dev] observando cambios en src/');
  }
})();
