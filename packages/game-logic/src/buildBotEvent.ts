/**
 * buildBotEvent.ts — attach idempotency fields to a bot action template.
 */

import type { SocketEvent } from '@ded/types/socket-events.js';
import type { GameId, PlayerId } from '@ded/types/enums.js';
import type { BotEventTemplate } from '@ded/types/bot-api.js';

export function buildSocketEvent(
  template: BotEventTemplate,
  gameId: GameId,
  playerId: PlayerId,
): SocketEvent {
  return {
    ...template,
    eventId: crypto.randomUUID(),
    gameId,
    playerId,
    timestamp: new Date().toISOString(),
  } as SocketEvent;
}
