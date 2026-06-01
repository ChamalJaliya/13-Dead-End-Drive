/**
 * bot-turn-runner.ts — schedules consecutive bot turns on the authoritative server.
 */

import type { GameState } from '@ded/types/game-state.js';
import type { PlayerId } from '@ded/types/enums.js';
import type { IdempotencyStore } from '@ded/network/eventRouter.js';
import { GameActionService } from './game-action.service.js';
import { BotTurnCoordinator } from './bot-turn.coordinator.js';

function isBotPlayerId(playerId: PlayerId): boolean {
  return playerId.startsWith('player-bot-');
}

export async function runBotTurnChain(
  initial: GameState,
  gameAction: GameActionService,
  botCoordinator: BotTurnCoordinator,
  idempotency: IdempotencyStore,
  onApplied: (state: GameState, eventId: string) => Promise<void>,
): Promise<GameState> {
  let state = initial;
  for (;;) {
    if (state.phase === 'LOBBY' || state.phase === 'GAME_OVER') break;
    const active = state.activePlayerId;
    if (!isBotPlayerId(active)) break;

    const botEvent = await botCoordinator.buildBotAction(state, active);
    if (!botEvent) break;

    try {
      state = gameAction.applyAction(state, botEvent, idempotency);
      await onApplied(state, botEvent.eventId);
    } catch {
      break;
    }
  }
  return state;
}
