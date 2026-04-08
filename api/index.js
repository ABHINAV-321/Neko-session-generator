export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  res.status(200).json({
    status: 'ok',
    message: 'WhatsApp Session Generator API',
    endpoints: {
      'POST /api/pair-session': 'Create pairing code session',
      'GET /api/status?sessionId=<id>': 'Check session status',
      'GET /api/qr?sessionId=<id>': 'Get QR code image',
      'GET /api/download?sessionId=<id>': 'Download session file',
      'GET /api/generate?sessionId=<id>': 'Generate session (legacy)',
    }
  });
}
