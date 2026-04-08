// Test script to debug Baileys connection flow
import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import os from 'os';

const logger = pino({ level: 'info' });

function getAuthDir(sessionId) {
  return path.join(os.tmpdir(), `auth_${sessionId}`);
}

async function testQRGeneration() {
  const sessionId = uuidv4();
  const authDir = getAuthDir(sessionId);

  console.log(`[TEST] Session ID: ${sessionId}`);
  console.log(`[TEST] Auth dir: ${authDir}`);

  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  try {
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    console.log(`[TEST] Auth state loaded`);

    const { version } = await fetchLatestBaileysVersion();
    console.log(`[TEST] Baileys version:`, version?.toString());

    const sock = makeWASocket({
      auth: state,
      logger,
      printQRInTerminal: false,
      generateHighQualityLinkPreview: true,
      timeout: 120000,
      keepAliveIntervalSeconds: 15,
      shouldReconnect: () => false,
      version,
      browser: ['Ubuntu', 'Chrome', '20.0.04'],
    });

    console.log(`[TEST] Socket created, waiting for connection.update...`);

    // Wait for QR
    const qrPromise = new Promise((resolve, reject) => {
      sock.ev.on('connection.update', (update) => {
        console.log(`[TEST] connection.update:`, JSON.stringify(update));
        if (update.qr) {
          resolve(update.qr);
        }
      });

      sock.ev.on('error', (err) => {
        console.error(`[TEST] socket error:`, err);
        reject(err);
      });

      setTimeout(() => {
        reject(new Error('Timeout waiting for QR'));
      }, 30000);
    });

    const qr = await qrPromise;
    console.log(`[TEST] QR received:`, qr.substring(0, 100) + '...');

    sock.logout();
    await cleanupAuthDir(sessionId);

  } catch (err) {
    console.error(`[TEST] Failed:`, err);
    await cleanupAuthDir(sessionId);
    throw err;
  }
}

async function cleanupAuthDir(sessionId) {
  const authDir = getAuthDir(sessionId);
  if (fs.existsSync(authDir)) {
    try {
      fs.rmSync(authDir, { recursive: true, force: true });
    } catch (err) {
      console.error(`Cleanup error:`, err);
    }
  }
}

testQRGeneration().then(() => {
  console.log('[TEST] Complete!');
  process.exit(0);
}).catch((err) => {
  console.error('[TEST] Fatal:', err);
  process.exit(1);
});
