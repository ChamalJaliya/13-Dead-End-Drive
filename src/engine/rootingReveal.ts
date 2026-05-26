/**
 * rootingReveal.ts — expose rooting ownership when a guest is eliminated
 */

import type { GameState } from '../types/game-state.js';
import type { CharacterId, PlayerId } from '../types/enums.js';
import { resolveCharacterOwner } from './characterOwnership.js';

export function exposeRootingForEliminated(
  state: GameState,
  eliminatedIds: readonly CharacterId[],
): GameState {
  if (eliminatedIds.length === 0) return state;

  const exposedRooting = { ...state.exposedRooting };
  for (const charId of eliminatedIds) {
    const owner = resolveCharacterOwner(state, charId);
    if (owner !== null) {
      exposedRooting[charId] = owner;
    }
  }

  return { ...state, exposedRooting };
}
