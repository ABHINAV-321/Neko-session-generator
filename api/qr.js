import { getSession } from './store.js';
import QRCode from 'qrcode';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId } = req.query;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  const session = await getSession(sessionId);

  if (!session || !session.qr) {
    return res.status(404).json({ error: 'QR code not available yet' });
  }

  try {
    // Generate QR code as PNG
    const qrDataUrl = await QRCode.toDataURL(session.qr, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    // Remove data:image/png;base64, prefix
    const base64 = qrDataUrl.replace(/^data:image\/png;base64,/, '');

    res.setHeader('Content-Type', 'image/png');
    res.send(Buffer.from(base64, 'base64'));
  } catch (err) {
    console.error('QR generation error:', err);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
}
