# 13 Dead End Drive

Digital adaptation of the Milton Bradley board game — TypeScript engine, React client, optional Python bot AI for solo play.

## Monorepo layout

| Path | Role |
|------|------|
| `packages/types`, `engine`, `network`, `game-logic` | Shared `@ded/*` workspace packages |
| `src/client/` | React UI, Zustand, FX, `GameSession` |
| `src/server/` | Colyseus room + Nest services |
| `apps/game-server/` | Nest + Colyseus authoritative online server |
| `services/bot-ai/` | Python FastAPI bot decisions |
| `data/fixtures/` | Contract golden files |

## Quick start

```bash
npm install
npm run dev
```

Open the lobby, enter your name, choose **1–3 AI opponents** and difficulty, then **Start solo game**.

### Online multiplayer (server-authoritative)

```bash
cp .env.example .env
# VITE_ONLINE_MULTIPLAYER=true

npm run dev:all
# client :5173, game-server :2567, bot-ai :8000
```

Use **Host online room** / **Join online** in the lobby. Local hot-seat multiplayer remains under **Local multiplayer**.

## Solo vs bots (Python service)

The client enumerates legal moves in TypeScript and asks the bot service to pick one. If the service is down, a built-in heuristic fallback runs in the browser.

### Run bot service locally

```bash
docker compose up bot-ai
```

Or without Docker:

```bash
cd services/bot-ai
python3 -m pip install fastapi uvicorn pydantic httpx pytest
PYTHONPATH=. uvicorn app.main:app --reload --port 8000
```

Vite proxies `/bot-api` → `http://localhost:8000` (see `vite.config.ts`). Optional env:

```bash
cp .env.example .env
# VITE_BOT_SERVICE_URL=/bot-api
```

### Tests

```bash
npx vitest run --reporter=verbose
cd services/bot-ai && PYTHONPATH=. python3 -m pytest tests/ -v
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server (client) |
| `npm run dev:server` | Nest + Colyseus game-server |
| `npm run dev:bot-ai` | Python bot service |
| `npm run dev:all` | Client + server + bot-ai |
| `npm run build` | Production client build |
| `npm test` | Vitest suite |
| `npm run test:bot-ai` | pytest for bot-ai |
| `npm run typecheck` | `tsc --noEmit` |
