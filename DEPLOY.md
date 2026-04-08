# Deployment Guide

## ⭐ **Primary Recommendation: Render.com**

Render is the **best hosting** for this WhatsApp session generator because it:
- ✅ Has **no serverless timeouts** → pairing code works perfectly
- ✅ Includes **free Redis** database
- ✅ Offers **free tier** with enough resources
- ✅ Simple Git-based deployment
- ✅ Always-on service (no cold starts)

### Deploy to Render (5 minutes)

1. **Push to GitHub** (if not already)
2. **Create Render account** at [render.com](https://render.com)
3. **Create Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repo
   - Name: `whatsapp-session-generator`
   - Environment: **Node**
   - Region: Choose closest
   - Branch: `main`
   - Build: `npm ci --only=production`
   - Start: `node server.js`
4. **Add Redis**:
   - Click "New +" → "Redis"
   - Name: `whatsapp-sessions-redis`
   - Plan: **Free**
   - Same region as web service
   - Create
5. **Get Redis credentials**:
   - Click your Redis database
   - Copy `connectionString` and `token`
6. **Set environment variables** on Web Service:
   - `UPSTASH_REDIS_REST_URL` = connectionString
   - `UPSTASH_REDIS_REST_TOKEN` = token
   - `NODE_ENV` = `production`
7. **Create Web Service** → Wait 5-10 min
8. **Visit**: `https://your-app.onrender.com`

✅ **Done!** Both QR and pairing code work without timeouts.

**See**: [RENDER_DEPLOY.md](./RENDER_DEPLOY.md) for detailed guide with troubleshooting.

---

## Alternative Platforms

### Vercel (QR Only ⚠️)

Vercel serverless functions **time out after 60-120 seconds**, which breaks the pairing code flow (requires user input for up to 2 minutes). QR code works fine.

```bash
cd session-generator
vercel --prod
```

**Note**: Pairing code will likely fail with "401 Connection Failure" on Vercel.

---

### Railway.app

Good alternative with free $5 credit monthly.

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

---

### Self-Host (VPS)

Any VPS (DigitalOcean, Linode, AWS EC2, etc.) works:

```bash
# On your server
git clone <your-repo>
cd session-generator
npm install --production
npm start

# Or with PM2 (recommended for production)
npm install -g pm2
pm2 start server.js --name whatsapp-session-gen
pm2 save
pm2 startup
```

---

### Fly.io

Excellent for long-running apps with free tier (3 VMs).

```bash
# Install flyctl
# Then:
fly launch
# Follow prompts, it creates fly.toml automatically
fly deploy
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `UPSTASH_REDIS_REST_URL` | ✅ Yes | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ Yes | Upstash Redis REST token |
| `PORT` | ❌ No | Port to listen on (default: 3000) |
| `NODE_ENV` | ⚠️ Recommended | Set to `production` |

**Getting Redis credentials**:
1. Sign up at [upstash.com](https://upstash.com)
2. Create a Redis database
3. Copy "REST URL" and "REST Token" from Details tab
4. Add to your hosting platform's env vars

---

## Project Structure

```
session-generator/
├── api/                  # API routes (serverless or Express)
│   ├── generate.js      # QR session creator (POST /api/generate)
│   ├── pair-session.js  # Pairing code handler (POST /api/pair-session)
│   ├── qr.js           # QR image (GET /api/qr)
│   ├── status.js       # Status poll (GET /api/status)
│   ├── download.js     # Session download (GET /api/download)
│   └── store.js        # Redis-backed session store
├── public/
│   └── index.html      # Cyberpunk UI
├── index.js            # Express app
├── server.js           # HTTP server starter
├── package.json
├── render.yaml         # Render configuration
└── Dockerfile          # Container config (optional)
```

---

## Testing After Deploy

1. **Health check**:
   ```
   GET https://your-app.com/api/health
   Should return: {"status":"ok","timestamp":"..."}
   ```

2. **QR flow**:
   ```
   POST https://your-app.com/api/generate
   → { "success": true, "sessionId": "..." }
   
   GET https://your-app.com/api/status?sessionId=...
   → eventually { "hasQr": true }
   
   GET https://your-app.com/api/qr?sessionId=...
   → returns PNG image
   ```

3. **Pairing flow**:
   ```
   POST https://your-app.com/api/pair-session
   { "phoneNumber": "919876543210" }
   → { "success": true, "sessionId": "..." }
   
   Poll /api/status → { "pairingCode": "12345678" }
   ```

---

## Common Issues

### "Redis connection failed"
- Check env vars are set correctly
- Redis database must be in "Available" state
- Wait 1-2 minutes after Redis creation for it to provision

### "Function timeout" (Vercel)
- Vercel serverless limited to 60-120s
- Pairing code won't work on Vercel
- Use Render or self-host instead

### "Cannot find module 'server.js'"
- Ensure `server.js` exists in root
- Start command must be `node server.js`

### "404 on /api/health"
- Health check path is `/api/health` (case-sensitive)
- Ensure routes are configured correctly

---

## Production Checklist

- [ ] Deploy to Render (or chosen platform)
- [ ] Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
- [ ] Test QR code generation end-to-end
- [ ] Test pairing code (if needed)
- [ ] Verify session download works
- [ ] Enable rate limiting (optional, add express-rate-limit)
- [ ] Add custom domain (optional)
- [ ] Set up monitoring/logs (Render provides built-in)

---

## Support

- **Render Docs**: https://render.com/docs
- **Upstash Redis**: https://upstash.com/docs/redis
- **Baileys**: https://github.com/whiskeysockets/baileys
- **Check logs**: In your hosting dashboard → Logs section

---

**Ready to deploy?** Follow the Render guide above and your session generator will be live in minutes! 🚀
