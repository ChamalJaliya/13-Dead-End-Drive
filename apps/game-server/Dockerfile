FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/game-server/package.json ./apps/game-server/
RUN npm ci -w @ded/game-server --omit=dev
COPY apps/game-server ./apps/game-server
COPY src ./src
WORKDIR /app/apps/game-server
RUN npm run build
ENV PORT=2567
EXPOSE 2567
CMD ["node", "dist/apps/game-server/src/main.js"]
