/**
 * FinanzasPro - Serverless Function para Vercel
 * Proporciona información de entorno y endpoints de estado / red.
 */

module.exports = (req, res) => {
  // Configuración de cabeceras CORS y Content-Type
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  // Responder a peticiones preflight OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const clientIp = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || 'Vercel Edge Network';
  const deployedUrl = `${proto}://${host}`;

  return res.status(200).json({
    app: 'FinanzasPro',
    version: '2.5.0',
    status: 'online',
    platform: 'Vercel Serverless',
    url: deployedUrl,
    lanUrl: deployedUrl,
    ip: clientIp,
    timestamp: new Date().toISOString()
  });
};
