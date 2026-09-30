# 🚀 Quick Deployment Guide

## Prerequisites

Before deploying, ensure you have:

1. ✅ GitHub account with code pushed
2. ✅ LiveKit Cloud account (free tier) - [cloud.livekit.io](https://cloud.livekit.io/)
3. ✅ Groq account (free tier) - [console.groq.com](https://console.groq.com/)
4. ✅ Google AI Studio account (free tier) - [aistudio.google.com](https://aistudio.google.com/)
5. ✅ Render account (free tier) - [render.com](https://render.com/)
6. ✅ Vercel account (free tier) - [vercel.com](https://vercel.com/)

---

## Step 1: Get API Keys

### LiveKit Cloud
1. Go to [cloud.livekit.io](https://cloud.livekit.io/)
2. Sign up / Log in
3. Create new project: "Aura Support"
4. Copy these values:
   - **WebSocket URL** (e.g., `wss://aura-xxxxx.livekit.cloud`)
   - **API Key** (e.g., `APIxxxxxxxxxxxxx`)
   - **API Secret** (e.g., `xxxxxxxxxxxxxxxxxxxx`)

### Groq
1. Go to [console.groq.com](https://console.groq.com/)
2. Sign up / Log in
3. Click "Create API Key"
4. Name it: "Aura Backend"
5. Copy the key (starts with `gsk_`)

### Google AI Studio
1. Go to [aistudio.google.com](https://aistudio.google.com/)
2. Sign up / Log in
3. Click "Get API Key"
4. Create new API key or use existing project
5. Copy the key

---

## Step 2: Deploy Backend to Render

### Option A: Blueprint Deployment (Recommended)

1. **Push code to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Go to Render Dashboard:**
   - Visit [dashboard.render.com](https://dashboard.render.com/)
   - Click **"New +"** → **"Blueprint"**

3. **Connect Repository:**
   - Select your GitHub account
   - Choose `aura-aria-support` repository
   - Click **"Connect"**

4. **Render detects `render.yaml` automatically**
   - Service name: `aria-backend` (or customize)
   - Click **"Apply"**

5. **Add Environment Variables:**
   Click on your service → **"Environment"** → Add these:

   ```bash
   LIVEKIT_URL=wss://your-instance.livekit.cloud
   LIVEKIT_API_KEY=APIxxxxxxxxxxxxx
   LIVEKIT_API_SECRET=your_secret_here
   GROQ_API_KEY=gsk_your_key_here
   GOOGLE_API_KEY=your_google_key_here
   FRONTEND_ORIGIN=http://localhost:5173
   DATABASE_URL=sqlite+aiosqlite:///./aura_support.db
   ```

   ⚠️ **Note:** We'll update `FRONTEND_ORIGIN` after Vercel deployment

6. **Deploy:**
   - Click **"Manual Deploy"** → **"Deploy latest commit"**
   - Wait 3-5 minutes for deployment
   - Copy your service URL (e.g., `https://aria-backend.onrender.com`)

### Option B: Manual Deployment

1. **Create Web Service:**
   - Dashboard → **"New +"** → **"Web Service"**
   - Connect GitHub repository

2. **Configure:**
   - **Name:** `aria-backend`
   - **Region:** Any (closest to your users)
   - **Branch:** `main`
   - **Root Directory:** (leave empty)
   - **Environment:** **Docker**
   - **Dockerfile Path:** `backend/Dockerfile`
   - **Instance Type:** **Free**

3. **Add environment variables** (same as Option A)

4. **Deploy**

---

## Step 3: Deploy Frontend to Vercel

1. **Go to Vercel Dashboard:**
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click **"Add New..."** → **"Project"**

2. **Import Repository:**
   - Select your GitHub account
   - Choose `aura-aria-support` repository
   - Click **"Import"**

3. **Configure Project:**
   - **Framework Preset:** **Other** (Vercel auto-detects Nitro)
   - **Root Directory:** `.` (leave as is)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.output` (default)
   - **Install Command:** `npm install` (default)

4. **Environment Variables:**
   Click **"Environment Variables"** and add:

   ```bash
   VITE_API_URL=https://aria-backend.onrender.com
   VITE_ENABLE_REAL_VOICE=true
   ```

   ⚠️ **Replace** `https://aria-backend.onrender.com` with your actual Render URL from Step 2

5. **Deploy:**
   - Click **"Deploy"**
   - Wait 2-3 minutes
   - Copy your deployment URL (e.g., `https://aura-aria.vercel.app`)

---

## Step 4: Update CORS Configuration

Now that frontend is deployed, update backend to allow requests from Vercel:

1. **Go to Render Dashboard** → Your service (`aria-backend`)
2. **Click "Environment"** tab
3. **Edit `FRONTEND_ORIGIN`** variable:
   ```bash
   FRONTEND_ORIGIN=http://localhost:5173,https://aura-aria.vercel.app
   ```
   ⚠️ **Replace** `https://aura-aria.vercel.app` with your actual Vercel URL

4. **Click "Save Changes"**
5. Render will automatically restart the service (~30 seconds)

---

## Step 5: Verify Deployment

### Check Backend Health

1. Open: `https://aria-backend.onrender.com/health`
2. Expected response:
   ```json
   {
     "status": "healthy",
     "timestamp": "2026-09-29T12:34:56.789Z"
   }
   ```

### Test Frontend

1. **Open your Vercel URL** (e.g., `https://aura-aria.vercel.app/support`)

2. **Cold Start (First Load):**
   - You'll see: "Waking up the server..."
   - Wait 30-60 seconds
   - Should show: "Server is ready!"

3. **Start a Call:**
   - Click **"Start Call"**
   - Allow microphone access when prompted
   - Wait for "Listening" state

4. **Test Order Tracking:**
   - Say or type: "Where is my order ORD-101?"
   - Agent should retrieve order details
   - Should mention "Out for Delivery"

5. **Test Return Eligibility:**
   - Say: "Can I return order ORD-102?"
   - Agent should explain order was delivered 15+ days ago
   - Should say return not eligible (outside 7-day window)

6. **Test Cancellation:**
   - Say: "Cancel my order ORD-103"
   - Agent should confirm order in "Processing" status
   - Should cancel successfully
   - Check order panel - status should update to "Cancelled"

7. **Test Policy Questions:**
   - Say: "What's your shipping policy?"
   - Should explain: Free above ₹499, ₹50 below

8. **End Call & Check Summary:**
   - Click **"End Call"**
   - Wait ~15-20 seconds
   - Summary should show:
     - Customer intent (e.g., ORDER_TRACKING)
     - Resolution status (e.g., RESOLVED)
     - Order ID mentioned
     - Key points
     - Full transcript

---

## Troubleshooting

### Backend Issues

#### "Service Unavailable" or 503 Error
- **Cause:** Cold start in progress
- **Solution:** Wait 30-60 seconds, refresh page

#### "CORS Error" in browser console
- **Cause:** `FRONTEND_ORIGIN` not updated
- **Solution:** 
  1. Check Render environment variables
  2. Ensure Vercel URL is in `FRONTEND_ORIGIN`
  3. Restart Render service

#### "LiveKit connection failed"
- **Cause:** Invalid LiveKit credentials
- **Solution:**
  1. Verify `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`
  2. Check LiveKit Cloud dashboard for correct values
  3. Ensure no extra spaces in environment variables

#### "Database not found"
- **Cause:** Database not initialized
- **Solution:**
  1. Check Render logs: Dashboard → Service → Logs
  2. Look for `python -m app.init_db` in startup logs
  3. If missing, manually trigger deploy

### Frontend Issues

#### Build Fails on Vercel
- **Cause:** Dependency issues
- **Solution:**
  1. Check Vercel build logs
  2. Verify `package.json` is committed
  3. Try: Settings → General → Framework Preset → **Other**

#### "Failed to fetch" error
- **Cause:** Wrong `VITE_API_URL`
- **Solution:**
  1. Vercel Dashboard → Project → Settings → Environment Variables
  2. Verify `VITE_API_URL` matches Render URL
  3. Redeploy: Deployments → Latest → **Redeploy**

#### Microphone not working
- **Cause:** Browser permission denied
- **Solution:**
  1. Click padlock icon in browser address bar
  2. Allow microphone access
  3. Refresh page

#### Voice quality issues
- **Cause:** Network latency or LiveKit Cloud region
- **Solution:**
  1. Check network connection
  2. Try different LiveKit Cloud region (closest to you)
  3. Check browser console for WebRTC errors

---

## Performance Optimization (Optional)

### Keep Backend Warm
Create a free UptimeRobot monitor:
1. Sign up at [uptimerobot.com](https://uptimerobot.com/)
2. Add monitor: `https://aria-backend.onrender.com/health`
3. Check every 5 minutes
4. ⚠️ **Note:** This may violate Render's free tier TOS - use at own risk

### CDN for Static Assets
Vercel automatically handles this via their global CDN.

---

## Cost Breakdown

| Service | Plan | Cost | Limits |
|---------|------|------|--------|
| **Render** | Free | $0/month | 512MB RAM, 750 hours/month |
| **Vercel** | Hobby | $0/month | 100GB bandwidth, unlimited deployments |
| **LiveKit Cloud** | Free | $0/month | 20 GB transfer/month |
| **Groq** | Free | $0/month | 14,400 requests/day |
| **Google AI Studio** | Free | $0/month | 60 requests/minute |
| **edge-tts** | Free | $0/month | Unlimited |

**Total Monthly Cost:** $0 🎉

---

## Next Steps

1. ✅ Test all features thoroughly
2. ✅ Share deployment URLs with team/reviewer
3. ✅ Monitor Render logs for errors
4. ✅ Check Vercel analytics for usage

---

## Support

If you encounter issues:

1. **Check Logs:**
   - **Render:** Dashboard → Service → Logs
   - **Vercel:** Dashboard → Project → Deployments → Latest → View Function Logs

2. **Common Issues:** See Troubleshooting section above

3. **Re-deploy:**
   - **Render:** Dashboard → Manual Deploy → Deploy latest commit
   - **Vercel:** Deployments → Latest → Redeploy

---

## Deployment URLs

After deployment, update these:

- **Frontend (Vercel):** `https://__________.vercel.app`
- **Backend (Render):** `https://__________.onrender.com`
- **LiveKit Room:** `wss://__________.livekit.cloud`

---

**🎉 Congratulations! Your Aria voice agent is now live!**

Test all scenarios and enjoy your free-tier deployed AI voice support system.
