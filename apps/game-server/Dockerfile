# Game server — Nest + Colyseus (monorepo workspaces; tsx for ESM + @ded/* package exports).
FROM node:24-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/game-server/package.json ./apps/game-server/
COPY packages/types/package.json ./packages/types/
COPY packages/engine/package.json ./packages/engine/
COPY packages/network/package.json ./packages/network/
COPY packages/game-logic/package.json ./packages/game-logic/

RUN npm ci -w @ded/game-server

COPY packages ./packages
COPY apps/game-server ./apps/game-server
COPY src ./src

WORKDIR /app/apps/game-server
ENV PORT=2567
EXPOSE 2567
CMD ["npx", "tsx", "src/main.ts"]
