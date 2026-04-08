# 🚀 Deploy to Render.com

This guide covers deploying the WhatsApp Session Generator to Render.com with full QR and Pairing Code support (no timeouts!).

---

## Why Render?

- ✅ **No function timeouts** - works perfectly for pairing code (which needs up to 2 minutes)
- ✅ **Free Redis** - included with free tier
- ✅ **Free SSL** - automatic HTTPS
- ✅ **Simple Git deployment** - push to deploy
- ✅ **Persistent service** - always-on, no cold starts

---

## Prerequisites

1. **GitHub account** (to connect repo)
2. **Upstash Redis** (or use Render's Redis):
   - Sign up at [upstash.com](https://upstash.com)
   - Create Redis database
   - Copy `REST URL` and `REST Token`

---

## Deployment Steps

### **Option A: One-Click Deploy (Recommended)**

[![Deploy to Render](https://render.com/images/deploy-to-render.svg)](https://render.com/deploy)

Click the button above and follow the prompts. It will:
- Import your GitHub repo
- Create Redis database
- Set environment variables
- Deploy automatically

**Manual setup** (if button doesn't work or you want custom config):

---

### **Option B: Manual Deploy via Dashboard**

1. **Go to [Render Dashboard](https://dashboard.render.com)**
   - Sign in (use GitHub)
   - Click **"New +"** → **"Web Service"**

2. **Connect Repository**
   - Choose your GitHub account
   - Select repo: `whatsapp-session-generator`
   - Click **"Connect"**

3. **Configure Service**
   ```
   Name: whatsapp-session-generator (or any name)
   Environment: Node
   Region: Choose closest to you (e.g., Oregon, Frankfurt)
   Branch: main (or master)
   Build Command: npm ci --only=production
   Start Command: node server.js
   ```

4. **Add Environment Variables**
   Click **"Advanced"** → **"Add Environment Variable"** for each:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `UPSTASH_REDIS_REST_URL` | *paste your Upstash URL* |
   | `UPSTASH_REDIS_REST_TOKEN` | *paste your Upstash token* |
   | `PORT` | `10000` (or leave blank - Render sets automatically) |

5. **Create Redis Database**
   - In Render Dashboard, click **"New +"** → **"Redis"**
   - Name: `whatsapp-sessions-redis`
   - Plan: **Free**
   - Region: Same as your web service
   - Create
   - After creation, copy:
     - `connectionString` (for UPSTASH_REDIS_REST_URL)
     - `token` (for UPSTASH_REDIS_REST_TOKEN)
   - Add these to your Web Service environment variables

6. **Deploy**
   - Click **"Create Web Service"**
   - Wait 5-10 minutes for first build
   - Your app will be live at: `https://your-app-name.onrender.com`

---

### **Option C: Deploy with render.yaml (Auto-config)**

If you pushed the `render.yaml` file to your repo:

1. Create Web Service as above
2. In the "Build & Deploy" section, check **"Use render.yaml"**
3. Render will auto-configure:
   - Web service with correct build/start commands
   - Redis database automatically
   - Environment variables linked

---

## ✅ **Verify Deployment**

After deployment completes:

1. **Open your URL**: `https://your-app.onrender.com`
2. Should see the cyberpunk UI
3. Click **"Generate QR Code"**
4. Get `{ "success": true, "sessionId": "..." }`
5. Wait 2-3 seconds → QR code appears
6. **Scan with WhatsApp** → Should connect successfully
7. **Session downloads** automatically

**Test Pairing Code:**
1. Enter phone number (with country code)
2. Click **"Get Pairing Code"**
3. Wait a few seconds → 8-digit code appears
4. Enter in WhatsApp → Session downloads

---

## 📊 **Upgrade/Downgrade**

### Free Tier (Hobby)
- **750 hours/month** (~31 days) - enough for 1 instance running 24/7
- **512 MB RAM** - sufficient for this app
- **Shared CPU** - fine for light usage
- **No sleep** - Render free services don't sleep (as of 2025)

### Starter ($7/month)
- **Always-on** with more resources
- **1 GB RAM** - handles more concurrent users
- **Better CPU** - faster QR generation

---

## 🔧 **Troubleshooting**

### **Issue**: "Cannot find module '@upstash/redis'"
**Fix**: Ensure `npm ci --only=production` is the build command (not `npm install`)

### **Issue**: Redis connection fails
**Fix**:
- Check env vars are set correctly in Render dashboard
- Redis database must be in **"Available"** state (not creating)
- Use `connectionString` (full URL) for `UPSTASH_REDIS_REST_URL`

### **Issue**: App crashes on start
**Fix**:
- Ensure `server.js` exists in root
- Check logs in Render Dashboard → "Logs" tab
- Common issue: missing `node server.js` in start command

### **Issue**: 404 on `/api/health`
**Fix**: Health check path must be `/api/health` (already configured in code)

### **Issue**: QR shows but scan fails (515 error)
**Fix**: Browser version should be `Chrome Windows 125.0.0` - already set in code. Redeploy if old version.

---

## 📝 **Important Files to Push**

Make sure these are in your GitHub repo:
```
/session-generator/
├── api/                    # API endpoints
│   ├── generate.js
│   ├── pair-session.js
│   ├── qr.js
│   ├── status.js
│   ├── store.js
│   └── download.js
├── public/
│   └── index.html         # Cyberpunk UI
├── index.js               # Express app
├── server.js              # Server starter (NEW)
├── package.json
├── render.yaml            # Render config (NEW)
└── Dockerfile             # Optional, as backup
```

---

## 🔄 **Continuous Deployment**

Render auto-deploys on git push:
1. Make changes locally
2. `git add . && git commit -m "Update"`
3. `git push origin main`
4. Render automatically rebuilds and deploys
5. Check logs for errors

---

## 💰 **Cost Estimate**

- **Free Tier**: $0/month (subject to Render's free tier limits)
- **Starter**: $7/month (recommended for production)
- **Redis**: Free on both tiers

**Total**: $0-7/month depending on tier

---

## 🎉 **Success!**

Your WhatsApp session generator is now:
- ✅ Running on Render.com
- ✅ No timeouts (pairing code works)
- ✅ Free Redis included
- ✅ Auto HTTPS
- ✅ Auto-deploys on push

**Your live URL**: `https://your-app-name.onrender.com`

---

## Need Help?

- Render Docs: https://render.com/docs
- Check logs: Render Dashboard → Your Service → Logs
- Test endpoints: `https://your-app.onrender.com/api/health`

---

**Next**: Deploy and test with real WhatsApp! 🚀📱
