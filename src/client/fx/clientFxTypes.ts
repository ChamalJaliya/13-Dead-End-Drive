/**
 * clientFxTypes.ts
 * Discriminated union of client-side presentation events derived from GameState diffs.
 */

import type { CharacterId, CellId, PlayerId, TrapId } from '../../types/enums.js';
import type { EliminationCause } from '../../types/enums.js';

export type ClientFxEvent =
  | {
      readonly type: 'TRAP_FIRED';
      readonly trapId: TrapId;
      readonly cellId: CellId;
      readonly victimNames: readonly string[];
    }
  | {
      readonly type: 'CHARACTER_ELIMINATED';
      readonly characterId: CharacterId;
      readonly cause: EliminationCause;
      readonly displayName: string;
    }
  | {
      readonly type: 'GAME_WON';
      readonly winnerId: PlayerId;
      readonly winCondition: string;
      readonly isLocalWinner: boolean;
    };

export function isTrapFiredEvent(
  event: ClientFxEvent,
): event is Extract<ClientFxEvent, { type: 'TRAP_FIRED' }> {
  return event.type === 'TRAP_FIRED';
}

export function isEliminationEvent(
  event: ClientFxEvent,
): event is Extract<ClientFxEvent, { type: 'CHARACTER_ELIMINATED' }> {
  return event.type === 'CHARACTER_ELIMINATED';
}

export function isGameWonEvent(
  event: ClientFxEvent,
): event is Extract<ClientFxEvent, { type: 'GAME_WON' }> {
  return event.type === 'GAME_WON';
}
