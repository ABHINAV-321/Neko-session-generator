# NEKO - WhatsApp Session Generator

Full-stack web application for generating WhatsApp session files with a cyberpunk-themed UI.

**Tech Stack**: Node.js + Express (backend) + HTML/CSS/JS (frontend)

## Features

- **🔑 Pairing Code (Recommended)**: Fast 8-digit code authentication
- **📱 QR Code**: Zero-touch scanning with WhatsApp mobile
- **🗜️ Compressed Sessions**: Gzip + base64 for minimal storage
- **📨 WhatsApp Self-Message**: Session ID sent directly to your WhatsApp
- **🖤 Cyberpunk UI**: Dark theme with neon green/cyan accents
- **📊 Real-time Status**: Live polling for QR/code and connection status
- **📱 Responsive**: Works on mobile and desktop

## Quick Start

```bash
cd session-generator
npm install
npm start
```

Open http://localhost:3000

## How It Works

### Pairing Code Method
1. Enter your WhatsApp number (with country code)
2. Get an 8-digit pairing code
3. Open WhatsApp → Settings → Linked Devices → Link a Device
4. Enter the code
5. Wait for connection → Session ID appears!

### QR Code Method
1. Click "Generate QR Code"
2. Scan with WhatsApp → Settings → Linked Devices → Link a Device
3. Wait for connection → Session ID appears!

On successful connection:
- Session is compressed and stored
- Session ID is sent via WhatsApp self-message
- You can copy the session ID or download it

## Using Session in Your Bot

### Option 1: Compressed Session String
The downloaded `.txt` file contains `NEKO-<base64>`. Use it as:
- Environment variable: `SESSION_ID="NEKO-..."`
- Or decode and write `auth_info_baileys` files manually

### Option 2: Downloaded Files
Extract the ZIP (if available) and place `auth_info_baileys` in your bot's working directory.

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/generate` | POST | Create QR-based session |
| `/api/pair-session` | POST | Create pairing code session (body: `{phoneNumber}`) |
| `/api/status?sessionId=` | GET | Poll for status, QR, pairing code, session string |
| `/api/qr?sessionId=` | GET | Get QR code PNG |
| `/api/download?sessionId=` | GET | Download session file |
| `/api/health` | GET | Health check |

## Project Structure

```
session-generator/
├── index.js              # Express server (main entry)
├── package.json
├── public/
│   └── index.html       # Cyberpunk frontend (single-page)
└── api/
    ├── generate.js      # QR session handler
    ├── pair-session.js  # Pairing code handler
    ├── qr.js           # QR image generator
    ├── status.js       # Status polling endpoint
    ├── download.js     # Session download endpoint
    └── store.js        # In-memory session store (with cleanup)

```

## Deployment

### **Recommended: Render.com** ⭐

Render is the best hosting choice for this app because:
- ✅ **No serverless timeouts** - pairing code works (needs up to 2 minutes)
- ✅ **Free Redis** included
- ✅ **Free tier** available
- ✅ Simple Git deployment

**Quick Deploy**:
1. Push to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Create **Web Service** → Connect repo
4. Build: `npm ci --only=production`
5. Start: `node server.js`
6. Add Redis env vars (see below)
7. Deploy!

**Detailed guide**: [RENDER_DEPLOY.md](./RENDER_DEPLOY.md)

---

### Other Platforms

Also works on:
- **Vercel** - QR code only (pairing code times out)
- **Railway** - Good alternative, $5 credit start
- **Koyeb** - Simple container deployment
- **Replit** - Free but may sleep
- **Heroku** - Legacy, may be deprecated

### Local Development

```bash
# Install dependencies
npm install

# Start server
npm start
```

Open http://localhost:3000

### Environment Variables

Required for production:
- `UPSTASH_REDIS_REST_URL` - Upstash Redis URL (from upstash.com)
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis token

Optional:
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - `production` recommended for deployment

## Dependencies

- `@whiskeysockets/baileys` (gifted-baileys fork) - WhatsApp Web client
- `express` - Web server
- `cors` - CORS middleware
- `pino` - Logging
- `qrcode` - QR code generation
- `uuid` - Session ID generation

## Security Notes

- Session files contain WhatsApp credentials - keep secure!
- Sessions auto-cleanup after 10 minutes (configurable in `api/store.js`)
- For production, add rate limiting and Redis-backed session store

## License

MIT

---

**Powered by [Baileys](https://github.com/whiskeysockets/baileys) | Cyberpunk UI by NEKO**

