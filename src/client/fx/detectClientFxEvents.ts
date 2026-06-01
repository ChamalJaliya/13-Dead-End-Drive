/**
 * detectClientFxEvents.ts
 * Pure diff: prev/next GameState → presentation events for audio, overlay, and scene FX.
 */

import type { GameState } from '../../types/game-state.js';
import type { CharacterId, PlayerId, TrapId } from '../../types/enums.js';
import { TRAP_IDS } from '../../types/enums.js';
import type { ClientFxEvent } from './clientFxTypes.js';

export function findTrapBoardCell(
  state: GameState,
  trapId: TrapId,
): { cellId: string } | null {
  const cell = Object.values(state.board).find((c) => c.trapRef === trapId);
  return cell ? { cellId: cell.cellId } : null;
}

function victimNamesForTrap(
  prev: GameState,
  next: GameState,
  trapId: TrapId,
): readonly string[] {
  const trap = next.traps[trapId];
  if (!trap) return [];

  const names: string[] = [];
  for (const char of Object.values(next.characters)) {
    if (char.status !== 'ELIMINATED') continue;
    const wasAlive = prev.characters[char.id]?.status === 'ALIVE';
    if (!wasAlive) continue;
    if (trap.eliminatesOnCells.includes(char.position)) {
      names.push(char.displayName);
    }
  }
  return names;
}

export function detectClientFxEvents(
  prev: GameState | null,
  next: GameState,
  localPlayerId: PlayerId,
): ClientFxEvent[] {
  if (!prev) return [];

  const events: ClientFxEvent[] = [];

  for (const trapId of TRAP_IDS) {
    const was = prev.traps[trapId]?.state;
    const now = next.traps[trapId]?.state;
    if (was === 'READY' && now === 'SPENT') {
      const trapCell = findTrapBoardCell(next, trapId);
      events.push({
        type:         'TRAP_FIRED',
        trapId,
        cellId:       trapCell?.cellId ?? next.traps[trapId]!.targetCells[0] ?? '',
        victimNames:  victimNamesForTrap(prev, next, trapId),
      });
    }
  }

  for (const char of Object.values(next.characters)) {
    const prevChar = prev.characters[char.id];
    if (prevChar?.status === 'ALIVE' && char.status === 'ELIMINATED') {
      const cause = char.eliminationCause ?? 'TRAP';
      events.push({
        type:         'CHARACTER_ELIMINATED',
        characterId:  char.id,
        cause,
        displayName:  char.displayName,
      });
    }
  }

  const becameGameOver =
    prev.phase !== 'GAME_OVER' &&
    next.phase === 'GAME_OVER' &&
    next.winner !== null;

  if (becameGameOver && next.winner !== null) {
    events.push({
      type:           'GAME_WON',
      winnerId:       next.winner,
      winCondition:   next.winCondition ?? 'LAST_ALIVE',
      isLocalWinner:  next.winner === localPlayerId,
    });
  }

  return events;
}
