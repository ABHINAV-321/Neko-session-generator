# 🐳 Deploy to Render with Docker

This guide covers deploying the WhatsApp Session Generator to Render using Docker containers.

---

## ✅ **Why Docker on Render?**

- **Consistent environment** - same locally and in production
- **No Node version issues** - Docker image specifies exact Node version
- **Easy deployment** - Render builds and runs the container automatically
- **All-in-one** - No separate Redis setup on Render (use Upstash)

---

## 📋 **Prerequisites**

1. **GitHub repository** with all code (including Dockerfile) ✅
2. **Upstash Redis** credentials:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. **Render account** (sign up at render.com)

---

## 🚀 **Step-by-Step Deployment**

### **1. Verify Dockerfile Exists**

Ensure your repo root contains `Dockerfile` (already included in this project).

```bash
ls -la Dockerfile
# Should show: -rw-r--r--  Dockerfile
```

---

### **2. Push All Changes to GitHub**

```bash
git add -A
git commit -m "Prepare for Render Docker deployment"
git push origin main
```

Wait for push to complete.

---

### **3. Create Render Docker Service**

1. Go to **Render Dashboard**: https://dashboard.render.com
2. Click **"New +"** → **"Docker"**
3. **Connect your repository**:
   - Select your GitHub account
   - Choose `session-generator` repo
   - Click **"Connect"**

4. **Configure Docker Service**:

   | Setting | Value |
   |---------|-------|
   | **Name** | `whatsapp-session-generator` (or any name) |
   | **Region** | Choose closest (e.g., Oregon, Frankfurt) |
   | **Branch** | `main` (or `master`) |
   | **Dockerfile Path** | `/Dockerfile` (default) |
   | **Build Command** | Leave blank (Dockerfile handles build) |
   | **Start Command** | Leave blank (Dockerfile CMD handles) |

5. **Add Environment Variables** (click "Advanced" → "Add Environment Variable"):

   | Key | Value |
   |-----|-------|
   | `UPSTASH_REDIS_REST_URL` | *Your Upstash Redis URL* |
   | `UPSTASH_REDIS_REST_TOKEN` | *Your Upstash Redis token* |
   | `NODE_ENV` | `production` |
   | `PORT` | `3000` |

   **Note**: The Dockerfile exposes port 3000, so set `PORT=3000`.

6. **Optional - Resources**:
   - **Plan**: Free (512 MB RAM, shared CPU)
   - **Disk**: 1 GB (free tier) is enough

7. Click **"Create Docker"**

---

### **4. Wait for Build & Deploy**

Render will:
1. Clone your repo
2. Build Docker image (takes 3-5 minutes on first deploy)
3. Push to container registry
4. Pull and run container
5. Run health checks

**Watch the Logs**:
- Click on your service name
- Go to **"Logs"** tab
- See real-time build and runtime logs

---

### **5. Verify Deployment**

Once status shows **"Live"** with a green checkmark:

1. **Get your URL**:
   ```
   https://your-service-name.onrender.com
   ```

2. **Test health endpoint**:
   ```bash
   curl https://your-service-name.onrender.com/api/health
   # Should return: {"status":"ok","timestamp":"..."}
   ```

3. **Open in browser**:
   - Visit your URL
   - Cyberpunk UI should load
   - Click **"Generate QR Code"**
   - QR should appear in 2-3 seconds ✅

4. **Test pairing code**:
   - Enter phone number
   - Click **"Get Pairing Code"**
   - 8-digit code should appear ✅

5. **Test full flow**:
   - Scan QR with WhatsApp
   - Session downloads automatically ✅

---

## 📝 **Dockerfile Explanation**

The included `Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder  # Lightweight Node.js 20
WORKDIR /app
COPY package*.json ./
COPY public ./public
RUN npm ci --only=production  # Install only prod dependencies
COPY api ./api
COPY index.js ./
COPY server.js ./
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if(r.statusCode!==200)throw new Error('Unhealthy')})"
CMD ["node", "server.js"]
```

- **Multi-stage build** (currently single stage, can optimize)
- **Alpine Linux** → small image (~100MB)
- **Health check** → Render knows when container is ready
- **Port 3000** → Render's default internal port

---

## 🔧 **Environment Variables Reference**

| Variable | Required | Description | Where to get |
|----------|----------|-------------|--------------|
| `UPSTASH_REDIS_REST_URL` | ✅ Yes | Redis connection string | Upstash Dashboard → Details |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ Yes | Redis auth token | Upstash Dashboard → Details |
| `NODE_ENV` | ⚠️ Recommended | Set to `production` | Enter manually |
| `PORT` | ⚠️ Required | Must be `3000` for Docker | Enter manually |

**Important**: The `PORT` must match what your app listens on (server.js uses `process.env.PORT || 3000`).

---

## 🐛 **Troubleshooting**

### **Issue**: Container crashes on start
**Check**:
- Render Logs → Look for error messages
- Ensure `server.js` exists and is executable
- Check that `node server.js` works locally in Docker

**Fix**:
```bash
# Test Docker locally first
docker build -t whatsapp-session-gen .
docker run -p 3000:3000 -e UPSTASH_REDIS_REST_URL=... -e UPSTASH_REDIS_REST_TOKEN=... whatsapp-session-gen
```

---

### **Issue**: "Address already in use" error
**Cause**: Multiple containers trying to bind to same port

**Fix**: Ensure your server listens on `process.env.PORT || 3000` (already done in server.js)

---

### **Issue**: Redis connection fails
**Check**:
- Environment variables are set correctly in Render
- Redis database is "Available" in Upstash
- No typos in URL/token

**Fix**: Re-copy credentials from Upstash dashboard

---

### **Issue**: Build takes too long / fails
**Cause**: Node modules installation

**Fix**: The Dockerfile uses `npm ci --only=production` which is optimized. If it fails, check:
- `package.json` syntax is valid
- All dependencies are available

---

### **Issue**: 404 on `/api/health`
**Cause**: Container not fully started or health check path wrong

**Fix**:
1. Wait 30-60 seconds after "Live" appears
2. Check Logs → Look for "Server running on port 3000"
3. Health check path should be `/api/health` (already correct)

---

## 📊 **Render Docker vs Web Service**

| Feature | Docker | Web Service (Node) |
|---------|--------|-------------------|
| **Control** | Full (custom base image, system packages) | Limited (Render manages runtime) |
| **Build time** | Longer (full docker build) | Faster (npm install only) |
| **Size** | Larger (includes Node + OS) | Smaller (just node_modules) |
| **Flexibility** | Can install system deps, use different Node versions | Fixed Node version |
| **Deploy simplicity** | Same as Web Service | Slightly simpler |

**For this project**: Both work fine. Docker is overkill but gives you full control.

---

## 🔄 **Continuous Deployment**

Render auto-deploys on **every push** to the connected branch:

1. Make changes locally
2. `git add . && git commit -m "Update"`
3. `git push origin main`
4. Render automatically:
   - Detects Dockerfile
   - Builds new image
   - Deploys new container
   - Zero downtime (gradual rollout)

---

## 💰 **Cost**

- **Free Tier**: 750 hours/month (enough for 1 instance running 24/7)
- **512 MB RAM** - sufficient for this app
- **1 GB Disk** - plenty for Node modules
- **No extra cost** for Docker vs Web Service

---

## 🎉 **Success Checklist**

- [ ] Dockerfile in repo root
- [ ] All code pushed to GitHub
- [ ] Upstash Redis created and credentials ready
- [ ] Render Docker service created
- [ ] Environment variables set (UPSTASH_URL, UPSTASH_TOKEN, NODE_ENV=production, PORT=3000)
- [ ] Build completes successfully
- [ ] Service status: **Live**
- [ ] Health endpoint returns 200
- [ ] QR code generates and displays
- [ ] Pairing code appears when requested
- [ ] Full connection flow works (scan QR → session downloads)

---

## 📞 **Need Help?**

1. **Check Render Logs** → "Logs" tab in dashboard
2. **Test locally with Docker** first (see commands above)
3. **Verify environment variables** are set correctly
4. **Check Docker build output** for errors

---

**Ready?** Click "Create Docker" in Render and watch the logs! 🚀
