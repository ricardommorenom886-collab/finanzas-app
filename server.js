/**
 * FinanzasPro - Servidor Local Multiplataforma
 * Sin dependencias externas - Ejecuta con puro Node.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;

// Obtener IP local de la red Wi-Fi / Ethernet
function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Filtrar IPv4 y descartar loopback
      if (net.family === 'IPv4' && !net.internal) {
        // Preferir redes domésticas habituales (192.168.x.x, 10.x.x.x)
        if (net.address.startsWith('192.168.') || net.address.startsWith('10.') || net.address.startsWith('172.')) {
          return net.address;
        }
      }
    }
  }
  return 'localhost';
}

const localIp = getLocalIp();

// Mapeo de tipos MIME
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Manejo de endpoint API para que la app web conozca la IP LAN automáticamente
  if (req.url === '/api/info') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    return res.end(JSON.stringify({
      localUrl: `http://localhost:${PORT}`,
      lanUrl: `http://${localIp}:${PORT}`,
      ip: localIp,
      port: PORT
    }));
  }

  // Resolver ruta de archivo estático
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(ROOT_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 - Archivo no encontrado');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('\n======================================================');
  console.log('   🚀 FinanzasPro - Aplicación Iniciada con Éxito');
  console.log('======================================================');
  console.log(`\n💻 En Microsoft Windows (esta PC):`);
  console.log(`   👉 http://localhost:${PORT}`);
  console.log(`\n📱 En tu teléfono Android (misma red Wi-Fi):`);
  console.log(`   👉 http://${localIp}:${PORT}`);
  console.log('\n💡 Tip: También puedes hacer clic en "Móvil" en la app');
  console.log('   para escanear el código QR con la cámara de tu Android.');
  console.log('======================================================\n');
});
