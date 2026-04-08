# 🚀 Quick Start Guide

## Session Generator Web App

This is a complete web service for generating WhatsApp session files, similar to https://session.silvatech.co.ke/

---

## 📋 Prerequisites

- Node.js 20+
- npm or yarn

---

## 🛠️ Installation

```bash
cd session-generator
npm install --legacy-peer-deps
```

---

## 🖥️ Running Locally

```bash
# Development mode
npm start
# or
node server.js
```

Then open your browser to: **http://localhost:3000**

---

## ☁️ Deploy to Vercel

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Deploy
```bash
vercel --prod
```

### 3. Done!
Your site will be live at a `.vercel.app` URL.

---

## 🔧 How to Use

1. **Open** the web app
2. **Click** "Generate New Session"
3. **Scan** the QR code with WhatsApp (Linked Devices)
4. **Wait** for connection to establish
5. **Download** the ZIP file
6. **Extract** and copy `auth_info_baileys` folder to your bot project
7. **Run** your bot - it connects automatically!

---

## 📁 Project Structure

```
session-generator/
├── api/
│   ├── generate.js    # POST /api/generate - Create new session
│   ├── status.js      # GET /api/status?sessionId= - Check status
│   ├── qr.js          # GET /api/qr?sessionId= - Get QR image
│   ├── download.js    # GET /api/download?sessionId= - Download ZIP
│   └── store.js       # In-memory session storage
├── public/
│   └── index.html    # Frontend UI
├── server.js         # Express server
├── package.json
└── vercel.json       # Vercel configuration
```

---

## ⚙️ Configuration

### Environment Variables
None required!

### Port
The server listens on `PORT` environment variable or `3000` by default.

---

## 🔐 Security Notes

⚠️ **IMPORTANT**: Session files contain your WhatsApp authentication credentials.

- Keep them secure
- Never share `auth_info_baileys` folder publicly
- Delete sessions from the server after downloading
- Use HTTPS in production
- Consider adding rate limiting for production

---

## 🐛 Troubleshooting

### "mkdir /tmp/auth_xxx" error
Make sure `/tmp` directory exists. If not, the code automatically falls back to `os.tmpdir()`.

### Port already in use
Change the port:
```bash
PORT=3001 node server.js
```

### QR not appearing
Make sure you allow a few seconds for the connection to establish and QR to generate.

---

## 📦 Dependencies

- `@whiskeysockets/baileys` (gifted-baileys fork) - WhatsApp client
- `express` - Web server
- `pino` - Logging
- `qrcode` - QR code generation (PNG)
- `qrcode-terminal` - QR code generation (text)
- `archiver` - ZIP creation
- `uuid` - Session ID generation

---

## 📝 License

MIT

---

## 🙏 Credits

Inspired by https://session.silvatech.co.ke/

Built with ❤️ for the WhatsApp bot community

---

**Enjoy generating WhatsApp sessions!** 📱✨
