# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

The Clock Game — a Price Is Right–style web app where a user has 30 seconds to guess an item's exact price. The host responds "higher", "lower", "you win", or "you lose". Built to learn GitLab CI/CD → Railway deployment.

## Commands

### Start both servers
```bash
./scripts/start_all.sh          # backend in background (logs/backend.log), frontend in foreground
./scripts/stop_all.sh           # stop both
```

### Start individually
```bash
./scripts/start_backend.sh      # FastAPI on :8000
./scripts/start_frontend.sh     # Vite React on :3000
```

### Backend (manual)
```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend (manual)
```bash
cd frontend
npm install
npm run dev       # dev server on :3000
npm run build     # production build → frontend/dist/
```

## Architecture

```
backend/
  main.py          — FastAPI app; all game logic lives here
  railway.toml     — Railway build/start config for backend service
  .env.example     — documents CORS_ORIGINS env var

frontend/
  vite.config.js   — proxies /api/* → localhost:8000 in dev only
  railway.toml     — Railway build/start config for frontend service
  src/
    App.jsx        — all game state (phase, timer, messages, gameId)
    App.css
    components/
      Timer.jsx    — visual countdown; turns orange ≤10s, red+pulsing ≤5s
      ChatBox.jsx  — auto-scrolling message list (host vs player bubbles)
      GuessInput.jsx
```

### Game flow

- `POST /api/game/start` — picks a random product, stores `{price, start_time}` in a server-side dict, returns `{game_id, product_name}` (price never sent to client)
- `POST /api/game/guess` — checks server-side elapsed time first (>30s → `you_lose`), then compares guess to price
- `GET /health` — Railway health check endpoint

The frontend runs its own 30s countdown for display only. The backend is authoritative on time. A `gameActiveRef` (useRef) guards against stale-closure races where a guess response arrives after the game has already ended client-side.

### API base URL

`App.jsx` prefixes all fetch calls with `import.meta.env.VITE_API_URL ?? ''`. In dev this is empty and Vite's proxy handles `/api/*`. In production, set `VITE_API_URL` to the Railway backend service URL in Railway's frontend service environment variables.

### State machine (App.jsx)

`idle` → `playing` (on start) → `ended` (on win, lose, or timer hitting 0)

## CI/CD & Deployment

### Pipeline (`.gitlab-ci.yml`)

| Stage | Job | Runs on |
|---|---|---|
| validate | `validate-frontend` — `npm ci && npm run build` | all branches |
| validate | `validate-backend` — install deps + import check | all branches |
| deploy | `deploy-backend` — `railway up --service backend` | default branch only |
| deploy | `deploy-frontend` — `railway up --service frontend` | default branch only |

### Required GitLab CI/CD variable

| Variable | Where to set | Notes |
|---|---|---|
| `RAILWAY_TOKEN` | GitLab → Settings → CI/CD → Variables | Mask it; get from Railway project settings |

### Required Railway environment variables

Set these in Railway's service settings, not in code:

**Backend service:**
| Variable | Value |
|---|---|
| `CORS_ORIGINS` | Frontend Railway URL, e.g. `https://clock-game-frontend.up.railway.app` |

**Frontend service:**
| Variable | Value |
|---|---|
| `VITE_API_URL` | Backend Railway URL, e.g. `https://clock-game-backend.up.railway.app` |

> `VITE_API_URL` is baked into the JS bundle at build time by Vite — set it before Railway runs the build.

### Railway project setup (one-time)

1. Create a new Railway project
2. Add two services: `backend` and `frontend`, both pointing to this repo
3. Set each service's **Root Directory** to `backend/` and `frontend/` respectively
4. Set the environment variables above
5. Get the project token from Railway → Settings → Tokens → add as `RAILWAY_TOKEN` in GitLab
