# Aura Aria Support

Aura Aria is a customer-support workspace for Aura Skincare. Customers can ask about demo orders by voice or text, receive deterministic order and policy answers, and review a persisted call transcript and summary.

Live frontend: `https://YOUR-VERCEL-URL`

## Architecture

```mermaid
flowchart LR
  Vercel[Vercel React frontend] -->|HTTPS REST| Railway[Railway FastAPI API]
  Vercel -->|WebRTC| LiveKit[LiveKit Cloud]
  LiveKit --> Render[Render free web service\nLiveKit agent]
  Railway --> Neon[(Neon free Postgres)]
  Render --> Neon
  Render --> Groq[Groq Whisper + Llama]
  Render --> EdgeTTS[edge-tts]
```

The API owns schema creation, idempotent demo seeding, order reset, session endpoints, and LiveKit token creation. The agent registers with LiveKit Cloud, joins rooms named `aria_support_<session-id>`, and never creates tables or seeds data.

## Voice pipeline

Browser microphone audio travels through LiveKit Cloud to the Render worker. Silero VAD detects turns, Groq Whisper performs speech recognition, Groq Llama handles the support conversation and tool calls, and edge-tts streams the response back through LiveKit to the browser. Transcript and voice-state events use the LiveKit data channel; final transcript lines and summaries are persisted in Neon.

## Tools and guardrails

Aria's system prompt limits the conversation to Aura support topics and requires an order ID before order-specific claims. The agent uses order lookup, return eligibility, and cancellation tools. Tool results are deterministic database or policy verdicts, so the model cannot invent order details or override cancellation and return rules. Tool-call badges are sent to the transcript UI.

## Tech stack

| Area | Technology | Reason |
| --- | --- | --- |
| Frontend | React 19, Vite, TanStack Router | Free static deployment and typed client routing |
| Voice transport | LiveKit Cloud | Free WebRTC rooms and data channels |
| API | FastAPI, SQLAlchemy async | Small typed REST service |
| Database | Neon Postgres | Shared hosted state for separate services |
| Agent | LiveKit Agents, Silero | Turn detection and room lifecycle |
| AI | Groq Whisper and Llama | Fast free-tier STT and LLM access |
| Speech | edge-tts | Free neural voice service |
| Hosting | Vercel, Railway, Render free | Separate resource profiles with free tiers |

## Local setup

### Backend API

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload
```

The local default is SQLite. Set `DATABASE_URL` to `postgresql+asyncpg://USER:PASSWORD@HOST/DBNAME?ssl=require` to test against Neon. Check `http://localhost:8000/api/health` and `http://localhost:8000/api/orders`.

### Frontend

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Set `VITE_API_URL` to the API base URL and `VITE_ENABLE_REAL_VOICE=true` for LiveKit mode. Free keys are available from [LiveKit Cloud](https://cloud.livekit.io), [Groq](https://console.groq.com/keys), and [Neon](https://neon.tech).

Deployment details are in [docs/DEPLOY.md](docs/DEPLOY.md).

## Evaluator scenarios

- Look up `ORD-101` and confirm out-for-delivery details.
- Cancel `ORD-103`, then reset demo orders and confirm it returns to Processing.
- Ask for a return of `ORD-102` and confirm the deterministic refusal.
- Try an invalid order ID and confirm Aria does not guess.
- Ask an out-of-scope question and confirm the guardrail response.
- Test unclear audio, interruption, and a typed message during a call.
- End the call and verify the transcript, JSON summary, Copy JSON, and new-call action.

## Known limitations

Free tiers can cold-start or sleep, Groq has rate limits, and edge-tts is an unofficial free service. The demo reset button intentionally restores only `ORD-101`, `ORD-102`, and `ORD-103`.

## Reflection drafts

### Why this architecture and stack?

<!-- NIKHIL: rewrite in your own words -->

The frontend, API, and voice worker have different resource needs, so they are deployed separately while sharing Neon state. Vercel serves the React app, Railway runs the light API, and Render keeps the heavier LiveKit worker isolated.

### Hardest part and how it was solved

<!-- NIKHIL: rewrite in your own words -->

Slow local Whisper, Ollama, and Piper processing on CPU led to Groq STT/LLM and edge-tts. Free-tier memory limits then forced the agent away from the API, and SQLite was replaced as the shared deployment database by Postgres.

### What I'd improve with one more week

<!-- NIKHIL: rewrite in your own words -->

I would add migrations, stronger integration tests against Postgres, better observability, and a production authentication and privacy model.

### What changes at 1,000 conversations a day

<!-- NIKHIL: rewrite in your own words -->

I would add managed connection pooling, queueing and autoscaling for workers, durable event processing, rate-limit controls, redacted analytics, and a paid speech stack with a clear service-level budget.

## Repository hygiene

`.gitignore` covers virtual environments, `node_modules`, environment files, SQLite databases, Python caches, build output, `.vercel`, and model artifacts. No secrets or large model files should be tracked; verify with `git ls-files` before publishing.