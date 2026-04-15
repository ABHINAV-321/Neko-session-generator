import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';
import { setSession, getSession, deleteSession } from './store.js';
import { waitUntil } from '@vercel/functions';
import fs from 'fs';
import path from 'path';
import os from 'os';

const logger = pino({ level: 'info' });

function getAuthDir(sessionId) {
  return path.join(os.tmpdir(), `auth_${sessionId}`);
}

async function cleanupAuthDir(sessionId) {
  const authDir = getAuthDir(sessionId);
  if (fs.existsSync(authDir)) {
    try {
      fs.rmSync(authDir, { recursive: true, force: true });
    } catch (err) {
      console.error(`Cleanup error for ${sessionId}:`, err);
    }
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phoneNumber } = req.body;

  if (!phoneNumber || !/^\d{10,15}$/.test(phoneNumber)) {
    return res.status(400).json({
      error: 'Invalid phone number',
      details: 'Please provide a valid phone number with country code (e.g., 919876543210)'
    });
  }

  let sessionId = null;
  let sock = null;
  let saveCreds = null;
  let workComplete = false;

  try {
    sessionId = uuidv4();
    console.log(`[PAIR] Starting session ${sessionId}`);
    const authDir = getAuthDir(sessionId);

    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    const { state, saveCreds: sc } = await useMultiFileAuthState(authDir);
    saveCreds = sc;

    // Get latest version and set browser
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      auth: state,
      logger,
      printQRInTerminal: false,
      generateHighQualityLinkPreview: false,
      timeout: 120000,
      keepAliveIntervalSeconds: 15,
      shouldReconnect: () => false,
      version,
      browser: ['Chrome', 'Windows', '125.0.0'],
    });

    const initialSession = {
      phoneNumber,
      method: 'pair',
      createdAt: Date.now(),
      pairingCode: null,
      connected: false,
      error: null,
      qr: null,
      sessionString: null,
      state,
    };

    await setSession(sessionId, initialSession);
    console.log(`[PAIR] Initial session saved`);

    const workPromise = new Promise((resolve) => {
      const timeout = setTimeout(() => {
        if (!workComplete) {
          console.log(`[PAIR] Timeout after 120s`);
          workComplete = true;
          resolve();
        }
      }, 120000);

      sock.ev.on('connection.update', async (update) => {
        console.log(`[PAIR] connection.update received:`, JSON.stringify(update, null, 2));
        const session = await getSession(sessionId);
        if (!session) {
          console.log(`[PAIR] Session not found, skipping update`);
          return;
        }

        const { connection, qr, pairingCode } = update;
        console.log(`[PAIR] Update fields - connection: ${connection}, qr: ${!!qr}, pairingCode: ${!!pairingCode}`);

        // In pairing mode, we expect pairingCode, not QR
        if (qr) {
          // Ignore QR in pairing mode (can appear but we don't want it)
          console.log(`[PAIR] Ignoring QR code (not used in pairing mode)`);
        }

        if (pairingCode) {
          session.pairingCode = pairingCode;
          await setSession(sessionId, session);
          console.log(`[PAIR] Pairing code received and saved: ${pairingCode}`);
        }

        if (connection === 'open') {
          console.log(`[PAIR] Socket connection opened`);
          // In pairing mode, connection opens when socket is ready
          // Now request the pairing code (must be after connection)
          try {
            const pairingCode = await sock.requestPairingCode(phoneNumber);
            console.log(`[PAIR] Requested pairing code: ${pairingCode}`);
            // Save the pairing code to session
            session.pairingCode = pairingCode;
            await setSession(sessionId, session);
          } catch (err) {
            console.error(`[PAIR] Failed to request pairing code:`, err);
            session.error = `Failed to request pairing code: ${err.message || err}`;
            await setSession(sessionId, session);
            if (!workComplete) {
              workComplete = true;
              clearTimeout(timeout);
              resolve();
            }
            return;
          }

          // User must enter the pairing code in WhatsApp to complete auth
          // We'll get creds.update when connection is fully established
        }

        if (connection === 'close') {
          const closeReason = update.lastDisconnect;
          const errorObj = closeReason?.error;
          const reasonCode = errorObj?.output?.statusCode || closeReason?.output?.statusCode || 'disconnected';
          const reasonText = errorObj?.message || closeReason?.output?.statusText || 'Connection closed';

          console.log(`[PAIR] Connection closed. Code: ${reasonCode}, Reason: ${reasonText}`);
          console.log(`[PAIR] Full disconnect:`, JSON.stringify(closeReason));

          session.error = `${reasonCode}: ${reasonText}`;
          await setSession(sessionId, session);
          await cleanupAuthDir(sessionId);

          if (!workComplete) {
            workComplete = true;
            clearTimeout(timeout);
            resolve();
          }
        }
      });

      // Handle credentials update (connection fully established)
      sock.ev.on('creds.update', async (updatedCreds) => {
        if (saveCreds) saveCreds(updatedCreds);
        const session = await getSession(sessionId);
        if (session) {
          session.state = { ...session.state, ...updatedCreds };
          // If we have both pairing code was requested and we get creds, connection is complete
          if (updatedCreds?.keys) {
            session.connected = true;
            session.sessionString = JSON.stringify(updatedCreds);
            await setSession(sessionId, session);
            await cleanupAuthDir(sessionId);
            if (!workComplete) {
              workComplete = true;
              clearTimeout(timeout);
              resolve();
            }
          }
        }
      });


      sock.ev.on('close', () => {
        console.log(`[PAIR] Socket closed`);
        if (!workComplete) {
          workComplete = true;
          resolve();
        }
      });

      sock.ev.on('error', (err) => {
        console.error(`[PAIR] Socket error:`, err);
        if (!workComplete) {
          workComplete = true;
          resolve();
        }
      });
    });

    waitUntil(workPromise);

    res.status(200).json({
      success: true,
      sessionId,
      message: 'Pairing session initialized. Poll /api/status for pairing code.',
    });

  } catch (err) {
    console.error('[PAIR] Error:', err);
    if (sock) try { sock.logout(); } catch (e) {}
    if (sessionId) {
      await deleteSession(sessionId);
      await cleanupAuthDir(sessionId);
    }
    res.status(500).json({ error: 'Failed to create pairing session', details: err.message });
  }
}
