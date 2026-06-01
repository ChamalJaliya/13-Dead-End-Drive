# Client — production Vite build served by nginx (proxies /bot-api and /lobby-api).
FROM node:24-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/game-server/package.json ./apps/game-server/
COPY packages/types/package.json ./packages/types/
COPY packages/engine/package.json ./packages/engine/
COPY packages/network/package.json ./packages/network/
COPY packages/game-logic/package.json ./packages/game-logic/

RUN npm ci

COPY index.html tsconfig.json vite.config.ts postcss.config.js tailwind.config.js ./
COPY public ./public
COPY src ./src
COPY packages ./packages
COPY data ./data

ARG VITE_BOT_SERVICE_URL=/bot-api
ARG VITE_LOBBY_API_URL=/lobby-api
ARG VITE_COLYSEUS_URL=ws://localhost:2567
ARG VITE_ONLINE_MULTIPLAYER=true

ENV VITE_BOT_SERVICE_URL=$VITE_BOT_SERVICE_URL
ENV VITE_LOBBY_API_URL=$VITE_LOBBY_API_URL
ENV VITE_COLYSEUS_URL=$VITE_COLYSEUS_URL
ENV VITE_ONLINE_MULTIPLAYER=$VITE_ONLINE_MULTIPLAYER

RUN npm run build

FROM nginx:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
