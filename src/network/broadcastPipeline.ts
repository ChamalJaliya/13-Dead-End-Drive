/**
 * broadcastPipeline.ts
 * Real-time event broadcast pipeline — Phase 3.3 implementation.
 *
 * Implements high-security asymmetric state synchronization (identity masking)
 * and fault-isolated multiplayer connection dissemination.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { GameState, PlayerState } from '../types/game-state.js';
import type { PlayerId } from '../types/enums.js';

export interface ClientSocket {
  emit(event: string, payload: unknown): void;
}

export interface SocketRegistry {
  getClientSocket(socketId: string): ClientSocket | undefined;
}

/**
 * Returns a secure, deeply immutably filtered copy of the GameState.
 * Strips characterIds, secret cards (until reveal), and trap hands for other players.
 */
export function filterStateForPlayer(state: GameState, targetPlayerId: PlayerId): GameState {
  const maskedPlayers: Record<PlayerId, PlayerState> = {};
  const revealSecrets = state.secretCardsRevealed;

  for (const [playerId, player] of Object.entries(state.players)) {
    if (playerId === targetPlayerId) {
      // Owner always sees their own rooting cards (including 2p secret cards).
      maskedPlayers[playerId] = {
        ...player,
        hasHiddenSecretCard: false,
      };
    } else {
      maskedPlayers[playerId] = {
        ...player,
        characterIds: [],
        hand:         [],
        secretCharacterIds:  revealSecrets ? player.secretCharacterIds : [],
        hasHiddenSecretCard: !revealSecrets && player.secretCharacterIds.length > 0,
      };
    }
  }

  return {
    ...state,
    players: maskedPlayers,
  };
}

/**
 * Disseminates state updates room-wide to all connected players, masking hidden cards
 * asymmetrically for each client socket, and isolating transport connection failures.
 */
export async function broadcastGameState(
  supabase: SupabaseClient,
  registry: SocketRegistry,
  roomId: string,
  state: GameState,
): Promise<void> {
  const { data, error } = await supabase
    .from('player_connections')
    .select('socket_id, player_id')
    .eq('room_id', roomId);

  if (error || !data) {
    console.error(`[Broadcast] Failed to fetch active room connections:`, error?.message);
    return;
  }

  for (const conn of data) {
    const { socket_id: socketId, player_id: playerId } = conn as { socket_id: string; player_id: PlayerId };

    try {
      const socket = registry.getClientSocket(socketId);
      if (!socket) {
        console.warn(`[Broadcast] Client connection socket not found in registry: ${socketId}`);
        continue;
      }

      // Asymmetric mask matching the target client's hidden identity visibility scope
      const maskedState = filterStateForPlayer(state, playerId);

      // Distribute secure StateSyncResponse payload to the channel
      socket.emit('STATE_SYNC', {
        gameState:   maskedState,
        privateHand: maskedState.players[playerId]?.hand ?? [],
      });
    } catch (err: unknown) {
      // Fault isolation: isolate socket failures, log context, and proceed cleanly
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Broadcast] Gracefully caught socket ${socketId} emission glitch:`, msg);
    }
  }
}
