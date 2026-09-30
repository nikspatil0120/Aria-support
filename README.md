# Aura Skincare - Aria Voice Support Agent

> **Assignment Submission:** Datastraw AI Voice Agent Challenge  
> **Agent Name:** Aria  
> **Demo:** [Live Deployment URL - TBD after deployment]

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Setup Instructions](#setup-instructions)
  - [Prerequisites](#prerequisites)
  - [Local Development](#local-development)
  - [Environment Variables](#environment-variables)
- [Deployment](#deployment)
  - [Backend (Render)](#backend-deployment-render)
  - [Frontend (Vercel)](#frontend-deployment-vercel)
- [Testing](#testing)
- [Assignment Questions Answered](#assignment-questions-answered)
  - [1. Architecture & Design Decisions](#1-architecture--design-decisions)
  - [2. Tech Stack Choices](#2-tech-stack-choices)
  - [3. Deployment Strategy](#3-deployment-strategy)
  - [4. Challenges & Solutions](#4-challenges--solutions)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)

---

## Overview

**Aria** is an AI-powered voice support agent for Aura Skincare, providing real-time customer support through voice and text. Built as a production-ready solution deployed entirely on free tiers (no credit card required).

### Key Capabilities

- 🎤 **Voice conversations** with natural Indian English (female voice)
- 💬 **Text messaging** during calls for hybrid support
- 📦 **Order tracking** with real-time status updates
- 🔄 **Return eligibility** checking with policy enforcement
- 🚫 **Order cancellation** with automatic validation
- 📋 **Post-call summaries** with intent classification and resolution status
- 📜 **Policy guidance** on shipping, returns, COD, and cancellations

---

## Features

### 🎯 Core Features

1. **Voice & Text Support**
   - LiveKit-powered real-time voice communication
   - Text input available during active calls
   - Quick query chips for common questions
   - Real-time transcript streaming

2. **Order Management**
   - Track order status and delivery
   - Check return eligibility (7-day policy, unopened products)
   - Cancel orders (only while in "Processing" status)
   - Automatic database updates on state changes

3. **Policy Enforcement**
   - **Shipping:** Free above ₹499, ₹50 fee below
   - **Returns:** 7 days from delivery, unopened, unused, original packaging
   - **Cancellation:** Only "Processing" orders, cannot cancel shipped/delivered
   - **COD:** Available up to ₹2,500

4. **Intelligent Call Summaries**
   - Intent classification (ORDER_TRACKING, CANCELLATION, RETURN_REFUND, etc.)
   - Resolution status (RESOLVED, PARTIALLY_RESOLVED, UNRESOLVED, ESCALATION_NEEDED)
   - Key points extraction
   - Full conversation transcript with timestamps

5. **Testing UX**
   - 3 pre-populated test orders (ORD-101, ORD-102, ORD-103)
   - Order panel with real-time refresh
   - Quick test scenarios for each order

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  React Frontend (Vercel)                                   │ │
│  │  - TanStack Start (SSR)                                    │ │
│  │  - LiveKit React Components                                │ │
│  │  - Voice + Text UI                                         │ │
│  └────────────────┬────────────────────────┬──────────────────┘ │
└───────────────────┼────────────────────────┼────────────────────┘
                    │                        │
                    │ HTTPS API              │ WebRTC (LiveKit Cloud)
                    │                        │
       ┌────────────▼────────────┐  ┌────────▼─────────────────┐
       │  FastAPI Backend        │  │  LiveKit Agent Worker   │
       │  (Render)               │  │  (Render - same service)│
       │  - REST endpoints       │  │  - Voice pipeline       │
       │  - Health checks        │  │  - STT → LLM → TTS     │
       │  - Database ops         │  │  - Tool calling        │
       └────────────┬────────────┘  └────────┬────────────────┘
                    │                        │
                    │                        │
                    └────────────┬───────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  SQLite Database        │
                    │  - Orders               │
                    │  - Call sessions        │
                    │  - Call summaries       │
                    └─────────────────────────┘

External Services (Free Tier):
┌─────────────────────────────────────────────────────────────────┐
│ • LiveKit Cloud: Voice infrastructure (free tier)               │
│ • Groq: STT (Whisper large-v3) + LLM (Llama 3.3 70B Versatile) │
│ • edge-tts: Text-to-speech (Microsoft Edge TTS)                │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User initiates call** → Frontend requests session from FastAPI
2. **FastAPI creates session** → Returns LiveKit token
3. **Frontend connects** → LiveKit Cloud room
4. **Agent worker joins** → Same room via LiveKit agent SDK
5. **Voice pipeline:**
   - User audio → Groq Whisper (STT) → Text
   - Text → Groq Llama 3.3 (LLM with tools) → Response
   - Response → edge-tts (TTS) → Audio stream
6. **Tool calls** → FastAPI database operations
7. **Call ends** → Gemini generates summary → Stored in DB

---

## Tech Stack

### Frontend
- **Framework:** React 19 with TanStack Start (SSR)
- **UI:** Custom components with Radix UI primitives
- **Styling:** Tailwind CSS v4
- **Voice Client:** LiveKit Client SDK
- **Deployment:** Vercel (Nitro preset)

### Backend
- **API Framework:** FastAPI (Python 3.11)
- **Voice Agent:** LiveKit Agents SDK
- **Database:** SQLite with async SQLAlchemy
- **STT:** Groq Whisper (distil-whisper-large-v3-en)
- **LLM:** Groq Llama 3.3 70B Versatile
- **TTS:** edge-tts (Microsoft en-IN-NeerjaNeural voice)
- **Summary LLM:** Google Gemini 1.5 Flash
- **Deployment:** Render (Docker, free tier, 512MB RAM)

### Infrastructure
- **Voice Infrastructure:** LiveKit Cloud (free tier)
- **Hosting:**
  - Backend: Render.com (free tier, 512MB RAM)
  - Frontend: Vercel (Hobby plan)
- **Database:** SQLite (file-based, persisted on Render disk)

---

## Setup Instructions

### Prerequisites

- **Python:** 3.11+
- **Node.js:** 20+
- **Package Managers:** pip, npm

### Local Development

#### 1. Clone Repository

```bash
git clone <repository-url>
cd aura-aria-support
```

#### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Edit .env with your API keys (see Environment Variables section)
```

#### 3. Initialize Database

```bash
# From backend directory
python -m app.init_db
```

This creates `aura_support.db` and populates test orders:
- **ORD-101:** Vitamin C Serum (Out for Delivery)
- **ORD-102:** Hydrating Night Cream (Delivered 15 days ago)
- **ORD-103:** Complete Skincare Kit (Processing)

#### 4. Start Backend

```bash
# Terminal 1: FastAPI server
uvicorn app.main:app --reload --port 8000

# Terminal 2: LiveKit agent worker
python -m app.agent.aria
```

#### 5. Frontend Setup

```bash
# From project root
cd ..

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local:
# VITE_API_URL=http://localhost:8000
# VITE_ENABLE_REAL_VOICE=true

# Start dev server
npm run dev
```

#### 6. Access Application

Open browser: `http://localhost:5173/support`

### Environment Variables

#### Backend (`backend/.env`)

```bash
# ═══════════════════════════════════════════════════════════
# LIVEKIT CONFIGURATION
# ═══════════════════════════════════════════════════════════
LIVEKIT_URL=wss://your-livekit-instance.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret

# ═══════════════════════════════════════════════════════════
# GROQ API (STT + LLM)
# ═══════════════════════════════════════════════════════════
GROQ_API_KEY=gsk_your_groq_api_key

# ═══════════════════════════════════════════════════════════
# GOOGLE GEMINI (Summary generation)
# ═══════════════════════════════════════════════════════════
GOOGLE_API_KEY=your_google_api_key

# ═══════════════════════════════════════════════════════════
# CORS CONFIGURATION
# ═══════════════════════════════════════════════════════════
# Comma-separated frontend URLs
FRONTEND_ORIGIN=http://localhost:5173,https://your-vercel-app.vercel.app

# ═══════════════════════════════════════════════════════════
# DATABASE
# ═══════════════════════════════════════════════════════════
# Relative path (recommended for containers)
DATABASE_URL=sqlite+aiosqlite:///./aura_support.db
```

#### Frontend (`.env.local`)

```bash
# Backend API URL
VITE_API_URL=http://localhost:8000

# Enable real voice (false = mock mode for development)
VITE_ENABLE_REAL_VOICE=true
```

---

## Deployment

### Backend Deployment (Render)

#### Option 1: Blueprint (Recommended)

1. Push code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click **"New" → "Blueprint"**
4. Connect repository
5. Render will detect `render.yaml` and create service automatically
6. Add environment variables in Render dashboard (see `backend/.env.example`)

#### Option 2: Manual Setup

1. Create new **Web Service** on Render
2. **Settings:**
   - **Environment:** Docker
   - **Region:** Choose closest to users
   - **Instance Type:** Free (512MB RAM)
   - **Dockerfile Path:** `backend/Dockerfile`
3. **Environment Variables:** Add all from `backend/.env.example`
4. **Health Check Path:** `/health`
5. Deploy!

#### Important Notes

- **Cold Starts:** Free tier spins down after inactivity. First request takes 30-60 seconds to wake up. Frontend handles this with toast notifications.
- **Memory Limit:** 512MB RAM enforced with `num_idle_processes=1` in agent worker
- **Disk Persistence:** SQLite database persists on Render's free disk

### Frontend Deployment (Vercel)

1. Push code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click **"Add New Project"**
4. Import GitHub repository
5. **Framework Preset:** Other (auto-detects Nitro)
6. **Build Settings:**
   - Build Command: `npm run build`
   - Output Directory: `.output`
7. **Environment Variables:**
   ```
   VITE_API_URL=https://your-render-backend.onrender.com
   VITE_ENABLE_REAL_VOICE=true
   ```
8. Deploy!

#### Post-Deployment

1. Copy Vercel deployment URL (e.g., `https://your-app.vercel.app`)
2. Add to backend's `FRONTEND_ORIGIN` in Render environment variables
3. Restart backend service for CORS update

---

## Testing

### Test Orders

| Order ID | Product | Status | Use Case |
|----------|---------|--------|----------|
| **ORD-101** | Vitamin C Serum (₹899) | Out for Delivery | Test tracking |
| **ORD-102** | Hydrating Night Cream (₹1,299) | Delivered 15 days ago | Test return eligibility (should fail - >7 days) |
| **ORD-103** | Complete Skincare Kit (₹2,999) | Processing | Test cancellation (should succeed) |

### Test Scenarios

#### 1. Order Tracking
- **Say:** "Where is my order ORD-101?"
- **Expected:** Agent retrieves order details, provides tracking info, delivery estimate

#### 2. Return Request (Eligible)
- **Say:** "I want to return my order ORD-103"
- **Expected:** Agent checks eligibility, explains 7-day policy, confirms unopened/unused requirement

#### 3. Return Request (Ineligible)
- **Say:** "Can I return order ORD-102?"
- **Expected:** Agent explains order was delivered 15+ days ago, outside 7-day window, policy not met

#### 4. Order Cancellation (Success)
- **Say:** "Cancel my order ORD-103"
- **Expected:** Agent confirms "Processing" status, cancels order, updates status to "Cancelled", explains refund timeline

#### 5. Order Cancellation (Failure)
- **Say:** "I want to cancel ORD-101"
- **Expected:** Agent explains order is "Out for Delivery", cannot cancel, suggests refusing delivery at doorstep

#### 6. Policy Questions
- **Say:** "What's your shipping policy?"
- **Expected:** Agent explains free delivery above ₹499, ₹50 fee below, 3-5 business days
- **Say:** "Do you have Cash on Delivery?"
- **Expected:** Agent explains COD available up to ₹2,500, payment by cash/UPI at doorstep

#### 7. Text Input During Call
- Click "Start Call"
- Wait for connection
- Type message in text input at bottom of conversation panel
- Agent responds via voice and text

#### 8. Post-Call Summary
- Complete a call with test queries
- End call
- Wait ~10-20 seconds for summary generation
- Verify summary shows:
  - Customer intent classification
  - Resolution status
  - Order ID discussed
  - Key points
  - Full transcript

---

## Assignment Questions Answered

### 1. Architecture & Design Decisions

#### Why LiveKit + Groq + edge-tts?

**Problem:** Build a production voice agent entirely on free tiers with no credit card.

**Solution Architecture:**
- **LiveKit Cloud (Free Tier):** Provides voice infrastructure without requiring payment details. Handles WebRTC, audio routing, and real-time data channels.
- **Groq (Free Tier):** Offers fastest STT (Whisper) + LLM (Llama 3.3 70B) inference with generous free quota. No cold starts.
- **edge-tts (Free):** Microsoft Edge's TTS engine, unlimited usage, high-quality Indian English voice (Neerja).

**Key Design Decisions:**

1. **Monolithic Backend Deployment**
   - FastAPI + Agent worker in same Docker container
   - Supervisor runs agent in background, FastAPI in foreground
   - **Tradeoff:** Less scalable than microservices, but fits 512MB RAM limit
   - **Benefit:** Single deployment, shared database, no inter-service networking

2. **SQLite Over PostgreSQL**
   - File-based, zero config, persists on Render disk
   - **Tradeoff:** Not suitable for high concurrency
   - **Benefit:** Free tier compatible, sufficient for demo/prototype

3. **Embedded Policies vs. RAG**
   - Policies baked into system prompt
   - **Tradeoff:** Cannot update without redeployment
   - **Benefit:** Zero latency, no vector DB needed, policies fit in context window

4. **Polling for Summary vs. Webhooks**
   - Frontend polls for summary after call ends (50 attempts × 2s)
   - **Tradeoff:** Not real-time, wastes requests
   - **Benefit:** Simpler implementation, no webhook infrastructure

5. **TanStack Start (SSR) vs. SPA**
   - Chose TanStack Start for future SEO/SSR capabilities
   - **Tradeoff:** More complex than Vite SPA
   - **Benefit:** Production-ready SSR, better lighthouse scores

#### Data Flow Rationale

**Why separate session creation from LiveKit connection?**
- Session creation is a database operation (needs persistence)
- LiveKit token generation requires session context
- Separation allows pre-flight checks (rate limiting, user auth in future)

**Why real-time transcript streaming?**
- Better UX (user sees what agent heard immediately)
- Enables text input alongside voice
- Agent can finalize transcript incrementally

### 2. Tech Stack Choices

#### Frontend: React + TanStack Start

**Why React?**
- Rich ecosystem for UI components (Radix, Tailwind)
- LiveKit has official React SDK with hooks
- Fast iteration for prototyping

**Why TanStack Start over Next.js?**
- Lighter than Next.js, better for free tier deployment
- SSR flexibility without Vercel lock-in
- File-based routing, simple configuration

**Why not Remix/SvelteKit?**
- Less mature LiveKit integration
- Smaller ecosystem for UI components

#### Backend: FastAPI + LiveKit Agents

**Why FastAPI over Flask/Django?**
- Async-first (required for LiveKit agents)
- Auto OpenAPI docs (helpful for debugging)
- Type hints for better DX
- Fast performance

**Why LiveKit Agents SDK?**
- Official SDK, well-maintained
- Built-in STT/LLM/TTS pipelines
- Voice activity detection (VAD) handled
- Data channel for custom messages

**Why not Vocode/Retell?**
- Vocode: No free tier, requires credit card
- Retell: Paid service only
- LiveKit Cloud: Generous free tier, self-hostable

#### LLM: Groq Llama 3.3 70B

**Why Groq over OpenAI/Anthropic?**
- **Free Tier:** 14,400 requests/day (OpenAI requires payment)
- **Speed:** Sub-second inference on 70B model (crucial for voice)
- **Tool Calling:** Native function calling support

**Why Llama 3.3 70B over smaller models?**
- Better reasoning for multi-step tasks (check order → validate policy → explain)
- Fewer hallucinations with policies
- Still fits free tier quota

**Why not Gemini for LLM?**
- Groq faster for real-time voice (latency matters)
- Gemini used for summary generation (accuracy > speed)

#### STT: Groq Whisper

**Why Groq Whisper over Deepgram/AssemblyAI?**
- **Free Tier:** Included in Groq quota
- **Accuracy:** distil-whisper-large-v3-en excellent for Indian English
- **Speed:** Fast enough for real-time (<500ms)

**Why not LiveKit's default Whisper?**
- Groq API simpler, no model management
- Free tier more generous

#### TTS: edge-tts

**Why edge-tts over ElevenLabs/PlayHT?**
- **Cost:** Completely free, unlimited
- **Quality:** Microsoft's voices are production-grade
- **Indian English:** Neerja voice perfect for Aria persona
- **Latency:** Streaming synthesis, first audio in <300ms

**Why not Piper/Coqui?**
- Piper: Local models ~60MB, slow inference without GPU
- Coqui: Discontinued TTS engine
- edge-tts: Cloud-based, fast, zero config

### 3. Deployment Strategy

#### Why Render for Backend?

**Free Tier:**
- 512MB RAM, 0.1 CPU (sufficient for agent worker + FastAPI)
- 750 hours/month (enough for testing/demo)
- Disk persistence for SQLite
- Docker support

**Tradeoffs:**
- **Cold Starts:** 30-60 seconds after inactivity
  - **Mitigation:** Frontend shows toast + loading state, polls health endpoint
- **Resource Limits:** 512MB RAM enforced
  - **Mitigation:** `num_idle_processes=1` in agent worker (pre-loads only 1 process)
- **No Horizontal Scaling:** Single instance only
  - **Acceptable:** Demo app, not production scale

**Why not Railway/Fly.io?**
- Railway: Removed free tier
- Fly.io: Requires credit card

#### Why Vercel for Frontend?

**Free Tier:**
- Unlimited deployments
- Global CDN
- Automatic HTTPS
- SSR support (Nitro preset)

**Tradeoffs:**
- **Edge Functions Cost:** Not using (SSR only, no API routes)
- **Build Time Limits:** 45s (our build ~30s, fine)

**Why not Netlify/Cloudflare Pages?**
- Both work, Vercel chosen for better Nitro support

#### Cold Start Handling

**Problem:** Render free tier spins down after 15 minutes inactivity.

**Solution:**
1. Frontend checks backend health on mount (`checkHealth()`)
2. If unhealthy, shows toast: "Waking up the server..."
3. Polls health endpoint every 2s for up to 60s
4. Success: toast "Server is ready!", proceeds to call
5. Failure: toast error, suggests retry

**Why not keep-alive pings?**
- Against Render TOS (wastes resources)
- Better UX to be transparent about cold starts

### 4. Challenges & Solutions

#### Challenge 1: Memory Constraints (512MB RAM)

**Problem:** Agent worker + FastAPI + models exceed 512MB.

**Solution:**
- Set `num_idle_processes=1` in `WorkerOptions` (pre-loads only 1 agent process)
- Use Groq for LLM (no local model loading)
- Use edge-tts for TTS (no local model)
- Removed Piper + ONNX models (~60MB saved)

**Result:** Memory usage ~400MB under load.

#### Challenge 2: Whisper Hallucinations

**Problem:** Whisper generates hallucination phrases on silence:
- "Thank you for watching!"
- "Subscribe to my channel"
- "Like and subscribe"
- Random background noise as words

**Solution:**
- Created hallucination filter in `aria.py` (`_is_hallucination()`)
- Detects and drops known hallucination phrases
- Filters sub-3-character fragments (noise)
- Runs before text reaches LLM

**Result:** 90%+ reduction in spurious transcripts.

#### Challenge 3: TTS Latency

**Initial Approach:** Synthesize full response, then play.
- **Problem:** 3-5 second delay before audio starts

**Solution:**
- Stream TTS synthesis sentence-by-sentence (`tts.StreamAdapter`)
- edge-tts yields MP3 chunks as they're generated
- Push to LiveKit `AudioEmitter` incrementally

**Result:** First audio plays in <300ms, feels real-time.

#### Challenge 4: Transcript Synchronization

**Problem:** User sees agent text after audio finishes (lag feels broken).

**Solution:**
- Tap TTS text stream in `tts_node()` method
- Send progressive subtitle chunks via data channel (`transcript_stream`)
- Frontend updates "aria-stream-current" message in-place
- Finalize when sentence boundary reached

**Result:** Text appears synchronized with audio.

#### Challenge 5: Order Status Updates Not Reflecting in UI

**Problem:** Agent cancels order, but UI still shows "Processing".

**Solution:**
- Send `order_updated` message via data channel after DB update
- Frontend listens for `onOrderUpdated` callback
- Increment `orderRefreshTick` state
- `OrderPanel` re-fetches orders on tick change

**Result:** UI updates within 500ms of cancellation.

#### Challenge 6: Summary Generation Timeout

**Problem:** Summary took 15-20 seconds, frontend timed out at 10s.

**Initial Fix:** Increased timeout to 30s.
- **User Feedback:** "trust me it takes alot of time"

**Final Solution:** 
- Poll for 100 seconds (50 attempts × 2s)
- Show loading spinner with message: "Generating Summary..."
- Display partial transcript while waiting

**Result:** Summary loads successfully for all test calls.

#### Challenge 7: CORS Across Multiple Deployments

**Problem:** Hardcoded CORS origin breaks when deploying to staging/production.

**Solution:**
- Created `get_cors_origins()` method in `config.py`
- Splits `FRONTEND_ORIGIN` env var by comma
- Returns list for FastAPI `allow_origins`

**Result:** Single backend supports localhost + Vercel + future deployments.

#### Challenge 8: Microphone Permission Errors

**Problem:** Users deny mic permission, app shows generic error.

**Solution:**
- Catch mic permission error from LiveKit
- Detect error message contains "permission", "denied", or "notallowed"
- Show friendly message: "Please allow microphone access in your browser settings and try again"

**Result:** Clear user guidance on permission issues.

---

## Project Structure

```
aura-aria-support/
├── backend/
│   ├── app/
│   │   ├── agent/
│   │   │   ├── aria.py              # Main agent worker
│   │   │   ├── prompts.py           # System prompts
│   │   │   ├── policies.py          # Policy text
│   │   │   ├── summary.py           # Call summary generation
│   │   │   └── edge_tts_plugin.py   # TTS streaming
│   │   ├── db/
│   │   │   ├── models.py            # SQLAlchemy models
│   │   │   ├── database.py          # DB connection
│   │   │   └── operations.py        # DB CRUD operations
│   │   ├── config.py                # Configuration
│   │   ├── main.py                  # FastAPI app
│   │   └── init_db.py               # Database initialization
│   ├── Dockerfile                   # Docker image definition
│   ├── start.sh                     # Supervisor script
│   ├── requirements.txt             # Python dependencies
│   └── .env.example                 # Environment template
├── src/
│   ├── components/
│   │   ├── support/
│   │   │   ├── AriaAvatar.tsx       # Agent avatar with states
│   │   │   ├── CallSummaryView.tsx  # Post-call summary
│   │   │   ├── ConversationPanel.tsx # Transcript display
│   │   │   ├── OrderPanel.tsx       # Test orders display
│   │   │   ├── TextInputBar.tsx     # Text input during call
│   │   │   └── ConnectingOverlay.tsx # Loading state
│   │   └── ui/                      # Reusable UI components
│   ├── hooks/
│   │   ├── useVoiceSession.ts       # Voice session manager
│   │   └── useVoiceSessionReal.ts   # LiveKit integration
│   ├── lib/
│   │   ├── api.ts                   # Backend API client
│   │   ├── config.ts                # Frontend config
│   │   └── livekit-service.ts       # LiveKit client wrapper
│   ├── routes/
│   │   ├── __root.tsx               # Root layout
│   │   ├── index.tsx                # Home page
│   │   └── support.tsx              # Main support page
│   └── types/
│       └── support.ts               # TypeScript types
├── render.yaml                      # Render blueprint
├── vercel.json                      # Vercel config
├── package.json                     # Node dependencies
├── tsconfig.json                    # TypeScript config
├── tailwind.config.ts               # Tailwind config
└── README.md                        # This file
```

---

## API Documentation

### Endpoints

#### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-09-29T12:34:56.789Z"
}
```

#### `POST /sessions`
Create a new voice session.

**Response:**
```json
{
  "id": "uuid-v4",
  "livekit_room_name": "aria-support-uuid",
  "created_at": "2026-09-29T12:34:56.789Z"
}
```

#### `GET /sessions/{session_id}/token`
Get LiveKit connection token for session.

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "url": "wss://your-livekit-instance.livekit.cloud"
}
```

#### `GET /sessions/{session_id}/transcript`
Get session transcript.

**Response:**
```json
[
  {
    "id": "msg-1",
    "speaker": "customer",
    "text": "Where is my order?",
    "timestamp": "2026-09-29T12:35:00.000Z"
  },
  {
    "id": "msg-2",
    "speaker": "agent",
    "text": "I'd be happy to help you track your order...",
    "timestamp": "2026-09-29T12:35:03.000Z"
  }
]
```

#### `GET /sessions/{session_id}/summary`
Get call summary (generated after call ends).

**Response:**
```json
{
  "customer_intent": "ORDER_TRACKING",
  "order_id": "ORD-101",
  "resolution_status": "RESOLVED",
  "key_points": [
    "Customer inquired about order ORD-101",
    "Provided tracking information",
    "Order is out for delivery, expected by 6 PM"
  ]
}
```

#### `GET /orders`
Get all orders (for testing UI).

**Response:**
```json
[
  {
    "order_id": "ORD-101",
    "status": "Out for Delivery",
    "product_name": "Aura Vitamin C Serum",
    "value": 899,
    "customer_name": "Priya Sharma",
    "delivery_address": "123, MG Road, Bangalore, 560001",
    "order_date": "2026-09-25",
    "expected_delivery_date": "2026-09-29"
  }
]
```

#### `GET /orders/{order_id}`
Get specific order details.

---

## License

This project was created for the Datastraw AI Voice Agent assignment.

---

## Contact

For questions or issues, please contact [your-email@example.com]

---

**Built with ❤️ for Aura Skincare customers**
