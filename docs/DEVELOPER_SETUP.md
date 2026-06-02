# Developer setup & run guide

Easy path to run **13 Dead End Drive** on your machine — with **Docker** (one command) or **without Docker** (Node + optional Python).

**Related docs:** [HOW_TO_PLAY.md](HOW_TO_PLAY.md) (rules) · [play_modes.md](../.context/play_modes.md) (solo / local / online architecture)

---

## What you need

| Tool | Version | Required for |
|------|---------|----------------|
| **Node.js** | **24+** recommended (22+ may work) | Client, game-server, tests |
| **npm** | 10+ (comes with Node) | Install & scripts |
| **Python** | **3.12+** | Solo bots (`bot-ai`) — optional (browser heuristic fallback exists) |
| **Docker** + **Docker Compose** | v2+ | Full stack without local Node/Python |

```bash
node -v    # v24.x
npm -v
python3 --version   # 3.12+ if running bot-ai locally
docker compose version
```

---

## 1. Get the code

```bash
git clone <your-repo-url> "13 Dead End Drive"
cd "13 Dead End Drive"
npm install
```

First `npm install` links workspace packages (`@ded/engine`, `@ded/types`, etc.).

---

## 2. Choose how to run

| Goal | Docker | Without Docker |
|------|--------|----------------|
| Fastest “just play” (solo + local + online) | [§3 Docker](#3-run-with-docker-recommended-for-new-devs) | [§4 Full local stack](#44-full-stack-solo--local--online) |
| UI only — local hot-seat (2–4 tabs) | Overkill — use [§4.2](#42-client-only--local-multiplayer) | `npm run dev` |
| Solo vs AI (best bot quality) | Docker stack or [§4.3](#43-client--bot-ai-solo) | `npm run dev` + bot-ai |
| Online multiplayer | [§3](#3-run-with-docker-recommended-for-new-devs) | [§4.4](#44-full-stack-solo--local--online) |
| Run tests only | Not needed | [§6 Verify](#6-verify-your-setup) |

---

## 3. Run with Docker (recommended for new devs)

Runs **client** (nginx), **game-server** (Nest + Colyseus), and **bot-ai** (Python). You do **not** need Node or Python on the host.

### 3.1 One-time env (optional)

```bash
cp .env.docker.example .env
```

Defaults work for localhost. Edit `.env` only if you need LAN play or Supabase (see [§5](#5-environment-variables)).

### 3.2 Start the stack

```bash
docker compose up --build
# or
npm run docker:up
```

Wait until all three services are healthy (first build can take several minutes).

### 3.3 Open the game

| What | URL |
|------|-----|
| **Game UI** | http://localhost:8080 |
| Colyseus WebSocket | `ws://localhost:2567` (browser uses this via env) |
| Bot AI (direct) | http://localhost:8000 |
| Game-server health | http://localhost:2567/health |

In the lobby:

- **Solo** — vs 1–3 bots  
- **Local** — host/join room code (same machine, multiple browser tabs)  
- **Online** — host/join over network (other devices must reach your machine; see [§7](#7-troubleshooting))

### 3.4 Stop

```bash
docker compose down
# or
npm run docker:down
```

Logs: `npm run docker:logs`

### 3.5 Rebuild client after env changes

`VITE_*` values are baked in at **build** time:

```bash
docker compose build client
docker compose up
```

---

## 4. Run without Docker

You run processes on the host. Vite dev server proxies `/bot-api` and `/lobby-api` to local ports (see `vite.config.ts`).

### 4.1 Environment file

```bash
cp .env.example .env
```

Key client vars (already set in `.env.example`):

```bash
VITE_BOT_SERVICE_URL=/bot-api
VITE_COLYSEUS_URL=ws://localhost:2567
VITE_ONLINE_MULTIPLAYER=true
```

Game-server reads `PORT`, `BOT_AI_URL`, `CORS_ORIGINS`, etc. from the same `.env` when started via workspace scripts.

### 4.2 Client only — local multiplayer

Best for **two–four players on one computer** (one tab per player). No bot service or game-server required.

```bash
npm run dev
```

| What | URL |
|------|-----|
| **Game UI** | http://localhost:5173 |

Lobby → **Local** → **Create room** / **Join with code**.

> Local mode uses **browser `localStorage`** — other PCs cannot join your room code. Use online mode for that.

### 4.3 Client + bot-ai (solo)

Solo vs AI with Python decisions (falls back to in-browser heuristic if bot-ai is down).

**Terminal 1 — bot service:**

```bash
npm run dev:bot-ai
```

Or manually:

```bash
cd services/bot-ai
python3 -m pip install fastapi uvicorn pydantic
PYTHONPATH=. python3 -m uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — client:**

```bash
npm run dev
```

Check bot health: http://localhost:8000/health

Lobby → **Solo** → pick opponents and difficulty → **Start solo game**.

### 4.4 Full stack (solo + local + online)

Three processes via one command:

```bash
npm run dev:all
```

| Process | Port | Role |
|---------|------|------|
| Vite client | **5173** | UI + proxies |
| game-server | **2567** | Lobby REST + Colyseus |
| bot-ai | **8000** | Solo bot decisions |

Open http://localhost:5173 → **Online** for networked play, or **Solo** / **Local** as above.

**Run services separately** (three terminals):

```bash
npm run dev:client    # :5173
npm run dev:server    # :2567
npm run dev:bot-ai    # :8000
```

Health checks:

```bash
curl -s http://localhost:2567/health
curl -s http://localhost:8000/health
```

### 4.5 Production-like client build (no Vite dev)

```bash
npm run build
npm run preview
```

Preview serves on http://localhost:4173 with the same `/bot-api` and `/lobby-api` proxies — still needs game-server and bot-ai running for online/solo bots.

---

## 5. Environment variables

| File | Use |
|------|-----|
| `.env.example` | Local dev (`npm run dev`, `dev:all`) |
| `.env.docker.example` | Docker Compose — copy to `.env` at repo root |

### Client (`VITE_*`)

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_BOT_SERVICE_URL` | `/bot-api` | Solo bot HTTP (proxied to :8000) |
| `VITE_LOBBY_API_URL` | `/lobby-api` | Online lobby REST (proxied to :2567) |
| `VITE_COLYSEUS_URL` | `ws://localhost:2567` | WebSocket for online play |
| `VITE_ONLINE_MULTIPLAYER` | `true` | Show **Online** in lobby |

### Game server

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `2567` | HTTP + Colyseus |
| `BOT_AI_URL` | `http://localhost:8000` (Docker: `http://bot-ai:8000`) | Server-side bot coordinator |
| `CORS_ORIGINS` | `http://localhost:5173` (+ `:8080` in Docker) | Allowed browser origins |
| `AUTH_REQUIRED` | `false` | Set `true` with Supabase JWT in production |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | empty | Room persistence when configured |

### Bot AI

| Variable | Default | Purpose |
|----------|---------|---------|
| `LLM_ENABLED` | `false` | Optional LLM strategy |
| `BOT_DIFFICULTY_DEFAULT` | `NORMAL` | Default difficulty |

### LAN / another device (Docker)

On the host machine, set in `.env` then rebuild client:

```bash
VITE_COLYSEUS_URL=ws://192.168.x.x:2567
```

```bash
docker compose build client && docker compose up
```

Ensure firewall allows **2567** (and **8080** for UI).

---

## 6. Verify your setup

```bash
# TypeScript
npm run typecheck

# Game + client tests (expect 181 passing)
npx vitest run --reporter=verbose

# Bot service tests (install dev deps once)
python3 -m pip install -e "./services/bot-ai[dev]"
npm run test:bot-ai

# Package boundaries (optional)
npm run lint:boundaries
```

---

## 7. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| **Online** card missing | `VITE_ONLINE_MULTIPLAYER=false` | Set `true` in `.env`, restart Vite or rebuild Docker client |
| “Could not create online room” | game-server not running | `npm run dev:server` or full Docker stack |
| WebSocket fails | Wrong `VITE_COLYSEUS_URL` | Match host IP/port; rebuild Docker client after change |
| Bots never move (solo) | Not bot’s turn, or orchestrator stuck | Finish **your** turn first; check console / event log |
| Bots use weak moves only | bot-ai down | Start `npm run dev:bot-ai` or Docker `bot-ai` service |
| Friend can’t join **local** room | Local = same browser profile | Use **Online** + reachable game-server |
| Docker build slow / fails | Stale cache | `docker compose build --no-cache` |
| Port already in use | Old process | Free 5173, 2567, 8000, or 8080 |

**Chair phase / movement:** see [HOW_TO_PLAY.md](HOW_TO_PLAY.md).

**Advanced rules (local host):** lobby → **Advanced rules** → `SECRET_PASSAGES`, `EXTENDED_TRAP_DECK` when profile is **ADVANCED**. See [board_rules_13_ded.md](../.context/board_rules_13_ded.md).

---

## 8. npm scripts cheat sheet

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite client (:5173) — local MP + engine in browser |
| `npm run dev:server` | Nest + Colyseus (:2567) |
| `npm run dev:bot-ai` | Python FastAPI (:8000) |
| `npm run dev:all` | Client + server + bot-ai |
| `npm run build` | Production client build → `dist/` |
| `npm run preview` | Serve `dist/` (:4173) |
| `npm test` | Vitest |
| `npm run docker:up` | `docker compose up --build` |
| `npm run docker:down` | Stop containers |

---

## 9. Repo map (where to edit)

| Path | What |
|------|------|
| `packages/engine/` | Game rules, `processTurn`, RFC 007 modules |
| `packages/types/` | `GameState`, socket events, `ruleProfile` |
| `src/client/` | React UI, lobby, HUD, `useGameStore` |
| `apps/game-server/` | Online authority, lobby REST |
| `services/bot-ai/` | Solo bot `POST /v1/decide` |
| `.context/` | Living design docs (read before big changes) |

---

## 10. Next steps

- Play modes deep-dive: [`.context/play_modes.md`](../.context/play_modes.md)  
- Engine / phase status: [`.context/system_state.md`](../.context/system_state.md)  
- Contributing / TDD: root [`.cursorrules`](../.cursorrules)
