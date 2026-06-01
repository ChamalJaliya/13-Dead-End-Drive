/**
 * main.ts — Nest HTTP + Colyseus WebSocket on a single port.
 */

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { GameServerModule, createIdempotencyStore } from './game-server.module.js';
import { DeadEndDriveRoom } from '../../../src/server/dead-end-drive.room.js';
import { configureRoomServices } from '../../../src/server/room-services.js';
import { GameActionService } from '../../../src/server/game-action.service.js';
import { RoomPersistenceService } from '../../../src/server/room-persistence.service.js';
import { BotTurnCoordinator } from '../../../src/server/bot-turn.coordinator.js';
import { loadGameServerEnv } from './env.config.js';

async function bootstrap(): Promise<void> {
  const env = loadGameServerEnv();
  const origins = [...env.corsOrigins];

  const app = await NestFactory.create(GameServerModule);
  app.enableCors({ origin: origins, credentials: true });

  configureRoomServices({
    gameAction:     app.get(GameActionService),
    persistence:    app.get(RoomPersistenceService),
    botCoordinator: app.get(BotTurnCoordinator),
    idempotency:    createIdempotencyStore(),
  });

  const httpServer = app.getHttpServer();
  const gameServer = new Server({
    transport: new WebSocketTransport({ server: httpServer }),
  });

  gameServer.define('dead_end_drive', DeadEndDriveRoom).enableRealtimeListing();

  const port = env.port;
  await app.listen(port);
  console.log(`[game-server] HTTP + Colyseus listening on :${port}`);
}

void bootstrap();
