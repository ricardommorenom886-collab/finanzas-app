const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'index.html');
const jsPath = path.join(__dirname, 'app.js');
const outputPath = path.join(__dirname, 'FinanzasPro_Movil.html');

let html = fs.readFileSync(htmlPath, 'utf8');
const js = fs.readFileSync(jsPath, 'utf8');

// Inline vendor scripts so mobile HTML is 100% self-contained offline
const vendorDir = path.join(__dirname, 'vendor');
const vendorFiles = [
  { match: '<script src="./vendor/tailwindcss.js"></script>', file: 'tailwindcss.js' },
  { match: '<script src="./vendor/lucide.min.js"></script>', file: 'lucide.min.js' },
  { match: '<script src="./vendor/chart.umd.min.js"></script>', file: 'chart.umd.min.js' },
  { match: '<script src="./vendor/confetti.browser.min.js"></script>', file: 'confetti.browser.min.js' },
  { match: '<script src="./vendor/qrcode.min.js"></script>', file: 'qrcode.min.js' },
];

for (const v of vendorFiles) {
  const filePath = path.join(vendorDir, v.file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    html = html.replace(v.match, `<script>\n${content}\n</script>`);
  }
}

const standalone = html.replace(/<script src="\.\/app\.js(?:\?[^"]*)?"><\/script>/, '<script>\n' + js + '\n</script>');
fs.writeFileSync(outputPath, standalone, 'utf8');

console.log('✅ FinanzasPro_Movil.html generado exitosamente.');
console.log('Tamaño total:', (standalone.length / 1024).toFixed(1), 'KB');
