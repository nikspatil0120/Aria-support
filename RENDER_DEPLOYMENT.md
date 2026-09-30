# 🚀 Render Deployment Guide (2-Service Architecture)

## Why 2 Services?

The original single-container approach hit the **512MB RAM limit** on Render's free tier because:
- FastAPI server: ~150MB
- LiveKit agent worker with Silero VAD: ~400MB
- **Total: ~550MB** = OOM (Out of Memory) error

**Solution:** Split into 2 separate free-tier services:
1. **Web Service** (API) - ~200MB RAM
2. **Background Worker** (Agent) - ~400MB RAM

Both fit within the 512MB limit independently!

---

## Deployment Steps

### Option 1: Blueprint (Recommended - Creates Both Services)

1. **Push code to GitHub** (already done ✅)

2. **Go to Render Dashboard:**
   - Visit [dashboard.render.com](https://dashboard.render.com/)
   - Click **"New +"** → **"Blueprint"**

3. **Connect Repository:**
   - Select GitHub account
   - Choose: `nikspatil0120/Aria-support`
   - Click **"Connect"**

4. **Render detects `render.yaml`:**
   - Creates **2 services automatically:**
     - `aura-aria-api` (Web Service)
     - `aura-aria-agent` (Background Worker)

5. **Add Environment Variables:**
   
   Click on **each service** → **"Environment"** tab → Add these:

   #### For BOTH Services (aura-aria-api + aura-aria-agent):
   ```bash
   LIVEKIT_URL=wss://your-instance.livekit.cloud
   LIVEKIT_API_KEY=APIxxxxxxxxxxxxx
   LIVEKIT_API_SECRET=your_secret_here
   GROQ_API_KEY=gsk_your_key_here
   DATABASE_URL=sqlite+aiosqlite:///./aura_support.db
   ```

   #### Only for API Service (aura-aria-api):
   ```bash
   FRONTEND_ORIGIN=http://localhost:5173,https://your-vercel-app.vercel.app
   ```

   #### Only for Agent Service (aura-aria-agent):
   ```bash
   GOOGLE_API_KEY=your_google_key_here
   ```

6. **Deploy Both:**
   - API service will be available at: `https://aura-aria-api.onrender.com`
   - Agent worker runs in background (no public URL)

---

### Option 2: Manual (Create Each Service Separately)

#### Step 2A: Create API Web Service

1. **Dashboard → New + → Web Service**
2. **Settings:**
   - Name: `aura-aria-api`
   - Environment: **Docker**
   - Branch: `main`
   - Region: Any (closest to you)
   - Dockerfile Path: `./backend/Dockerfile`
   - Docker Command: `./start_api_only.sh`
   - Instance Type: **Free**

3. **Add environment variables** (see list above for API service)

4. **Deploy**

#### Step 2B: Create Agent Background Worker

1. **Dashboard → New + → Background Worker**
2. **Settings:**
   - Name: `aura-aria-agent`
   - Environment: **Docker**
   - Branch: `main`
   - Region: Same as API service
   - Dockerfile Path: `./backend/Dockerfile`
   - Docker Command: `./start_agent_only.sh`
   - Instance Type: **Free**

3. **Add environment variables** (see list above for Agent service)

4. **Deploy**

---

## Verifying Deployment

### 1. Check API Service

Open: `https://aura-aria-api.onrender.com/api/health`

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-09-30T..."
}
```

### 2. Check Agent Worker Logs

1. Dashboard → `aura-aria-agent` → **Logs**
2. Look for:
   ```
   registered worker
   agent_name: ""
   id: AW_...
   url: wss://aura-....livekit.cloud
   ```

3. **Important:** Should NOT see:
   ```
   Out of memory (used over 512Mi)  ❌
   ```

---

## Memory Usage (Expected)

| Service | Memory Usage | Status |
|---------|--------------|--------|
| **aura-aria-api** | ~200MB | ✅ Under limit |
| **aura-aria-agent** | ~400MB | ✅ Under limit |
| **Total** | ~600MB | ✅ Each service independent |

---

## Troubleshooting

### API Service Issues

#### "Service Unavailable" / 503
- **Cause:** Cold start
- **Solution:** Wait 30-60 seconds, refresh

#### "CORS Error" in browser
- **Cause:** `FRONTEND_ORIGIN` missing or wrong
- **Solution:**
  1. Add Vercel URL to `FRONTEND_ORIGIN`
  2. Format: `http://localhost:5173,https://your-app.vercel.app`
  3. Restart service

### Agent Worker Issues

#### "Failed to register worker"
- **Cause:** Invalid LiveKit credentials
- **Solution:** Verify `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`

#### "Out of memory" (still!)
- **Cause:** Agent loading too many models
- **Solution:** Already optimized with:
  - `num_idle_processes=0`
  - `prewarm_fnc` disabled
  - If still OOM, contact me for further optimization

#### "Worker not joining room"
- **Cause:** Agent service not running
- **Solution:** Check logs in Render dashboard
- Verify agent shows "registered worker" message

---

## Database Sharing Between Services

Both services use the **same SQLite database** file:
- Location: `./aura_support.db` (relative path in each container)
- **Problem:** Each service has its own file system
- **Impact:** 
  - ⚠️ API creates orders in its DB
  - ⚠️ Agent creates summaries in its DB
  - They **don't sync** automatically

### Solutions:

#### Option A: Shared Disk (Render Paid Feature)
Mount a shared disk between both services.
- **Cost:** $1/month for 1GB
- **Not free tier compatible** ❌

#### Option B: Use PostgreSQL (Recommended for Production)
Replace SQLite with Render's free PostgreSQL:
1. Create free PostgreSQL database on Render
2. Update `DATABASE_URL` to PostgreSQL connection string
3. Change SQLAlchemy driver from `aiosqlite` to `asyncpg`

**For Demo/Testing:** Current setup works if you only test one feature at a time:
- Order tracking: Works (agent reads from its DB)
- Summaries: Work (agent writes to its DB)
- Cross-service data: Won't sync (API writes orders, agent can't read them)

#### Option C: Keep As-Is for Demo
If you're just demonstrating features:
- Test orders are seeded on agent startup
- Agent can track/cancel orders in its own DB
- Summaries work perfectly
- Just avoid testing features that need both services to share data

---

## Next Steps

1. ✅ Deploy both services to Render
2. ✅ Verify API health endpoint works
3. ✅ Check agent worker logs (should see "registered worker")
4. ✅ Deploy frontend to Vercel (use API service URL)
5. ✅ Update `FRONTEND_ORIGIN` in API service
6. ✅ Test end-to-end voice call

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│  Render Free Tier (2 services, both 512MB RAM)          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌───────────────────────┐  ┌────────────────────────┐ │
│  │  aura-aria-api       │  │  aura-aria-agent      │ │
│  │  (Web Service)        │  │  (Background Worker)   │ │
│  │                       │  │                        │ │
│  │  • FastAPI            │  │  • LiveKit Agent      │ │
│  │  • Health endpoint    │  │  • Groq STT/LLM       │ │
│  │  • Session creation   │  │  • edge-tts TTS       │ │
│  │  • Order API          │  │  • Silero VAD         │ │
│  │  • Summary API        │  │  • Tool calling       │ │
│  │                       │  │                        │ │
│  │  ~200MB RAM           │  │  ~400MB RAM           │ │
│  └───────────────────────┘  └────────────────────────┘ │
│           │                          │                  │
│           └──────────┬───────────────┘                  │
│                      │                                   │
│          ┌───────────▼───────────┐                     │
│          │  SQLite DB (per svc)  │                     │
│          │  aura_support.db      │                     │
│          └───────────────────────┘                     │
└──────────────────────────────────────────────────────────┘
                       │
                       │ WebRTC + API calls
                       ▼
           ┌─────────────────────┐
           │  LiveKit Cloud      │
           │  (Voice Infra)      │
           └─────────────────────┘
                       │
                       ▼
           ┌─────────────────────┐
           │  Frontend (Vercel)  │
           │  React + TanStack   │
           └─────────────────────┘
```

---

## Cost Summary

| Service | Type | Cost | Memory |
|---------|------|------|--------|
| aura-aria-api | Web Service | $0 | 512MB (uses ~200MB) |
| aura-aria-agent | Background Worker | $0 | 512MB (uses ~400MB) |
| **Total** | **Both Services** | **$0/month** | **1GB total allocated** |

---

**✅ Deployment ready! Both services will stay within free tier limits.**
