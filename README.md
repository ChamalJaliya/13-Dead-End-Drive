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

**Full guide (Docker + local):** **[docs/DEVELOPER_SETUP.md](docs/DEVELOPER_SETUP.md)**

### Without Docker (fastest for local hot-seat)

```bash
npm install
npm run dev
```

Open http://localhost:5173 → **Local** for same-machine multiplayer, or **Solo** (heuristic bots; add `npm run dev:bot-ai` in another terminal for Python AI).

### With Docker (full stack, no local Node/Python)

```bash
cp .env.docker.example .env   # optional
npm run docker:up
```

Open http://localhost:8080 — solo, local, and online modes.

### Full local stack (no Docker)

```bash
cp .env.example .env
npm run dev:all
```

Client :5173 · game-server :2567 · bot-ai :8000

**How to play (rules):** [docs/HOW_TO_PLAY.md](docs/HOW_TO_PLAY.md). **Advanced rules** (secret passages, extended deck): local host → **Advanced rules** in the lobby when using **ADVANCED** profile — see [board_rules](.context/board_rules_13_ded.md).

### Tests

```bash
npx vitest run --reporter=verbose
npm run test:bot-ai
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
| `npm run docker:up` | Build and start full stack (Docker Compose) |
| `npm run docker:down` | Stop Docker Compose stack |
