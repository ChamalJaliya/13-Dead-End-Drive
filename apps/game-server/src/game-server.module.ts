import { Module } from '@nestjs/common';
import { LobbyController } from './lobby.controller.js';
import { LobbyService } from './lobby.service.js';
import { HealthController } from './health.controller.js';
import { GameActionService } from '../../../src/server/game-action.service.js';
import { RoomPersistenceService } from '../../../src/server/room-persistence.service.js';
import { BotTurnCoordinator } from '../../../src/server/bot-turn.coordinator.js';
import { InMemoryIdempotencyStore } from '@ded/network/eventRouter.js';

@Module({
  controllers: [LobbyController, HealthController],
  providers:   [
    LobbyService,
    GameActionService,
    RoomPersistenceService,
    BotTurnCoordinator,
  ],
  exports: [GameActionService, RoomPersistenceService, BotTurnCoordinator],
})
export class GameServerModule {}

export function createIdempotencyStore(): InMemoryIdempotencyStore {
  return new InMemoryIdempotencyStore();
}
