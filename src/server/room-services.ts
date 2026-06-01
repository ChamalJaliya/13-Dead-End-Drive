/**
 * room-services.ts — Nest-injected services shared by Colyseus room (RFC 006).
 */

import { GameActionService } from './game-action.service.js';
import { RoomPersistenceService } from './room-persistence.service.js';
import { BotTurnCoordinator } from './bot-turn.coordinator.js';
import { InMemoryIdempotencyStore, type IdempotencyStore } from '@ded/network/eventRouter.js';

export interface RoomServices {
  readonly gameAction: GameActionService;
  readonly persistence: RoomPersistenceService;
  readonly botCoordinator: BotTurnCoordinator;
  readonly idempotency: IdempotencyStore;
}

let services: RoomServices | null = null;

export function configureRoomServices(next: RoomServices): void {
  services = next;
}

export function getRoomServices(): RoomServices {
  if (!services) {
    services = {
      gameAction:     new GameActionService(),
      persistence:    new RoomPersistenceService(),
      botCoordinator: new BotTurnCoordinator(),
      idempotency:    new InMemoryIdempotencyStore(),
    };
  }
  return services;
}
