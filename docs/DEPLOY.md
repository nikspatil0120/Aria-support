# Deployment

The deployment has three independently configured services:

```mermaid
flowchart LR
  Browser[Vercel React frontend] -->|HTTPS REST| API[Railway FastAPI API]
  Browser -->|WebRTC| LK[LiveKit Cloud]
  LK --> Agent[Render free web service\nLiveKit agent]
  API --> Neon[(Neon Postgres)]
  Agent --> Neon
  Agent --> Groq[Groq STT + LLM]
  Agent --> TTS[edge-tts]
```

## Neon

1. Create a free Neon project and database.
2. Prefer the direct connection string rather than the pooled string.
3. Convert it to SQLAlchemy async form:

```text
postgresql+asyncpg://USER:PASSWORD@HOST/DBNAME?ssl=require
```

The application removes `sslmode` and `channel_binding` query parameters for asyncpg and enables TLS itself.

## Railway API

Create a GitHub service with root directory `backend`. Configure Docker with `Dockerfile.api` and add:

```text
DATABASE_URL
LIVEKIT_URL
LIVEKIT_API_KEY
LIVEKIT_API_SECRET
FRONTEND_ORIGIN
```

Set `FRONTEND_ORIGIN` to the Vercel production URL plus any local or preview origins separated by commas. The health check is `/api/health`.

## Render agent

Create a **Web Service**, not a background worker. Use root directory `backend`, Dockerfile `Dockerfile.agent`, and the free plan. The service must listen on Render's `PORT`; the LiveKit worker binds its built-in health server to that port and serves `/`.

Configure:

```text
DATABASE_URL
LIVEKIT_URL
LIVEKIT_API_KEY
LIVEKIT_API_SECRET
GROQ_API_KEY
GROQ_STT_MODEL=whisper-large-v3-turbo
GROQ_LLM_MODEL=llama-3.3-70b-versatile
TTS_VOICE=en-IN-NeerjaNeural
TTS_RATE=+8%
```

The included `render.yaml` describes this one web service. UptimeRobot can request the Render URL every five minutes to reduce free-tier sleeping.

## Vercel

Import the repository as a Vite project. Build with `npm run build`; the output is `.output/public`. Add:

```text
VITE_API_URL=https://YOUR-RAILWAY-URL
VITE_ENABLE_REAL_VOICE=true
```

After deployment, put the Vercel URL in Railway's `FRONTEND_ORIGIN` and redeploy the API.

## Local verification

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload
```

In another terminal, check `http://localhost:8000/api/health` and `http://localhost:8000/api/orders`. For Neon, replace `DATABASE_URL` in `backend/.env` with the async URL above, then start the same API process. The API creates tables and resets only the three demo orders at startup; the agent never creates tables or seeds data.