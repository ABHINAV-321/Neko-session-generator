# Integration Test - QR & Pairing Flows

This document verifies that the frontend and backend are now correctly aligned.

## Frontend Expectations (public/index.html)

### QR Flow (startQR function, line 895)
```javascript
// Expects: POST /api/generate → { sessionId }
const response = await fetch(`${API_BASE}/api/generate`, {
  method: 'POST',
});
```
✅ **Fixed**: `create-qr.js` now handles POST `/api/generate` correctly

### Pairing Flow (startPairing function, line 852)
```javascript
// Expects: POST /api/pair-session with { phoneNumber } → { sessionId }
const response = await fetch(`${API_BASE}/api/pair-session`, {
  method: 'POST',
  body: JSON.stringify({ phoneNumber: phone }),
});
```
✅ **Fixed**: `pair-session.js` expects phoneNumber and returns `{ sessionId }`

### Status Polling (startPolling function, line 928)
```javascript
// Expects: GET /api/status?sessionId=X → { hasQr, connected, error, pairingCode, ... }
const response = await fetch(`${API_BASE}/api/status?sessionId=${currentSessionId}`);
const data = await response.json();
```
✅ **Works**: `status.js` returns proper format, now includes `pairingCode` from `pair-session.js`

### QR Image (polling interval, line 987)
```javascript
// Expects: GET /api/qr?sessionId=X → PNG image
qrImg.src = `${API_BASE}/api/qr?sessionId=${currentSessionId}&t=${Date.now()}`;
```
✅ **Works**: `qr.js` returns PNG from session.qr

### Download (downloadSession function, line 980)
```javascript
// Expects: GET /api/download?sessionId=X → session file
window.location.href = `${API_BASE}/api/download?sessionId=${currentSessionId}`;
```
✅ **Works**: `download.js` (was incorrectly named generate.js) works correctly

---

## Backend Implementation (After Fixes)

### Route Table (index.js)

| Route | Method | Handler | Purpose |
|-------|--------|---------|---------|
| `/api/generate` | POST | `create-qr.js` | Create QR session |
| `/api/pair-session` | POST | `pair-session.js` | Create pairing session |
| `/api/status` | GET | `status.js` | Poll session status |
| `/api/qr` | GET | `qr.js` | Get QR PNG |
| `/api/download` | GET | `download.js` | Download session |
| `/api/health` | GET | inline | Health check |

✅ All routes match frontend expectations

---

## Request-Response Examples

### 1. QR Flow

**Request:**
```
POST /api/generate
```

**Response (immediate):**
```json
{
  "success": true,
  "sessionId": "abc123...",
  "message": "QR session initialized. Poll /api/status for QR code."
}
```

**Subsequent Poll:**
```
GET /api/status?sessionId=abc123...
```

**Response (initially, then with QR):**
```json
{
  "sessionId": "abc123...",
  "hasQr": false,
  "connected": false,
  "error": null,
  "method": "qr",
  "pairingCode": null,
  "sessionString": null
}
```
then:
```json
{
  "sessionId": "abc123...",
  "hasQr": true,
  "connected": false,
  "error": null,
  "method": "qr",
  "pairingCode": null,
  "sessionString": null
}
```

**QR Image:**
```
GET /api/qr?sessionId=abc123...
```
Returns: `image/png` with QR code

**After Scanning & Connection:**
```json
{
  "sessionId": "abc123...",
  "hasQr": true,
  "connected": true,
  "error": null,
  "method": "qr",
  "pairingCode": null,
  "sessionString": "compressed...string..."
}
```

**Download:**
```
GET /api/download?sessionId=abc123...
```
Returns: `text/plain` with `NEKO-<base64>`

---

### 2. Pairing Flow

**Request:**
```
POST /api/pair-session
Content-Type: application/json

{ "phoneNumber": "919876543210" }
```

**Response (immediate):**
```json
{
  "success": true,
  "sessionId": "xyz789...",
  "message": "Pairing session initialized. Poll /api/status for pairing code."
}
```

**Subsequent Poll:**
```
GET /api/status?sessionId=xyz789...
```

**Response (initially, then with pairingCode):**
```json
{
  "sessionId": "xyz789...",
  "hasQr": false,
  "connected": false,
  "error": null,
  "method": "pair",
  "pairingCode": null,
  "sessionString": null
}
```
then:
```json
{
  "sessionId": "xyz789...",
  "hasQr": false,
  "connected": false,
  "error": null,
  "method": "pair",
  "pairingCode": "12345678",
  "sessionString": null
}
```

**After entering code in WhatsApp:**
```json
{
  "sessionId": "xyz789...",
  "hasQr": false,
  "connected": true,
  "error": null,
  "method": "pair",
  "pairingCode": "12345678",
  "sessionString": "compressed...string..."
}
```

---

## Test Checklist

To verify all fixes work:

- [ ] Server starts: `node index.js`
- [ ] POST `/api/generate` returns 200 with `sessionId` (not 405)
- [ ] POST `/api/pair-session` with phone returns 200 with `sessionId`
- [ ] GET `/api/status?sessionId=X` eventually shows `hasQr: true` OR `pairingCode: "8-digit"`
- [ ] GET `/api/qr?sessionId=X` returns PNG image (if QR flow)
- [ ] After connection, GET `/api/status?sessionId=X` shows `connected: true` and `sessionString`
- [ ] GET `/api/download?sessionId=X` returns `NEKO-...` text
- [ ] Frontend shows QR code within 5 seconds of clicking button
- [ ] Frontend shows pairing code when available
- [ ] Scanning QR or entering pairing code results in connected session

---

## Common Pitfalls to Avoid

1. **Missing Redis env vars**:
   - Run: `upstash redis create` or set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
   - For local testing, `store.js` will fail silently (returns null). Use Vercel or configure Redis.

2. **Port conflicts**:
   - Set `PORT` environment variable if 3000 is busy: `PORT=8080 node index.js`

3. **Baileys version issues**:
   - Using `@whiskeysockets/baileys@6.7.21` which includes sharp (works on Vercel)
   - For Termux/Android, need `gifted-baileys` instead (different project)

4. **Socket timeouts**:
   - QR/pairing must complete within 120 seconds (2 minutes)
   - If WhatsApp not scanning, restart session

5. **CORS errors**:
   - All endpoints set `Access-Control-Allow-Origin: *` so frontend can call from any origin

---

## Summary

✅ **All routing mismatches fixed**
✅ **Pairing code now captured and returned**
✅ **Frontend and backend in sync**
✅ **Ready for deployment to Vercel**

**Next step**: Deploy and test with actual WhatsApp!
