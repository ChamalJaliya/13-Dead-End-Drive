/**
 * characterOwnership.ts
 * Resolves which player holds a character card (visible or 2-player secret).
 */

import type { GameState, PlayerState } from '../types/game-state.js';
import type { CharacterId, PlayerId } from '../types/enums.js';

export function isTwoPlayerVariant(state: GameState): boolean {
  return state.turnOrder.length === 2;
}

/** All character IDs a player is rooting for (visible cards + 2p secret cards). */
export function rootedCharacterIdsForPlayer(player: PlayerState): readonly CharacterId[] {
  return [...player.characterIds, ...player.secretCharacterIds];
}

/** Who holds the character card for this guest (visible or secret). */
export function resolveCharacterOwner(
  state: GameState,
  charId: CharacterId,
): PlayerId | null {
  for (const player of Object.values(state.players)) {
    if (player.characterIds.includes(charId)) {
      return player.playerId;
    }
    if (player.secretCharacterIds.includes(charId)) {
      return player.playerId;
    }
  }
  return null;
}

export function playerHasLivingRootedCharacter(
  state: GameState,
  playerId: PlayerId,
): boolean {
  const player = state.players[playerId];
  if (!player) {
    return false;
  }
  return rootedCharacterIdsForPlayer(player).some((charId) => {
    const ch = state.characters[charId];
    return ch !== undefined && ch.status === 'ALIVE';
  });
}
