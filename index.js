import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Import route handlers
import generateHandler from './api/generate.js';
import pairSessionHandler from './api/pair-session.js';
import qrHandler from './api/qr.js';
import statusHandler from './api/status.js';
import downloadHandler from './api/download.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.post('/api/generate', generateHandler);
app.post('/api/pair-session', pairSessionHandler);
app.get('/api/qr', qrHandler);
app.get('/api/status', statusHandler);
app.get('/api/download', downloadHandler);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
