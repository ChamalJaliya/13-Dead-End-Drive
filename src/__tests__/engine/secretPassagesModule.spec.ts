// secretPassagesModule.spec.ts — SECRET_PASSAGES board + teleport (RFC 007 Phase 3)

import { describe, it, expect } from 'vitest';
import { initializeGame } from '../../engine/gameInitializer.js';
import { moveCharacter } from '../../engine/moveCharacter.js';
import { GRID_21X15_SECRET_PASSAGE_CELLS } from '../../engine/boardDefinition.js';
import { applyDiceRoll } from '../../engine/diceRoller.js';
import { applyMovementPlan } from '../../engine/movementPlan.js';
import { makeGameState, makeDiceRoll } from '../fixtures/gameState.fixtures.js';
import type { CharacterId } from '../../types/enums.js';

describe('SECRET_PASSAGES module', () => {
  it('marks five grid cells as secret passages when module is enabled', () => {
    const state = initializeGame(
      'sp-board',
      ['p1', 'p2'],
      { p1: 'A', p2: 'B' },
      { ruleProfile: 'ADVANCED', enabledModules: ['SECRET_PASSAGES'] },
    );
    for (const cellId of GRID_21X15_SECRET_PASSAGE_CELLS) {
      expect(state.board[cellId]?.isSecretPassage).toBe(true);
      expect(state.board[cellId]?.cellType).toBe('SECRET_PASSAGE');
    }
  });

  it('does not enable secret passages in STANDARD profile', () => {
    const state = initializeGame('sp-std', ['p1', 'p2'], { p1: 'A', p2: 'B' });
    for (const cellId of GRID_21X15_SECRET_PASSAGE_CELLS) {
      expect(state.board[cellId]?.isSecretPassage).toBe(false);
    }
  });

  it('allows a 1-pip teleport between two passage cells', () => {
    const from = GRID_21X15_SECRET_PASSAGE_CELLS[0]!;
    const to = GRID_21X15_SECRET_PASSAGE_CELLS[1]!;
    let state = initializeGame(
      'sp-move',
      ['p1', 'p2'],
      { p1: 'A', p2: 'B' },
      { ruleProfile: 'ADVANCED', enabledModules: ['SECRET_PASSAGES'] },
    );

    const guest = state.players['p1']!.characterIds[0] as CharacterId;
    const chars = { ...state.characters };
    for (const id of Object.keys(chars) as CharacterId[]) {
      const ch = chars[id];
      if (ch) {
        chars[id] = { ...ch, isOnRedChair: false };
      }
    }
    chars[guest] = {
      ...chars[guest]!,
      position: from,
      isOnRedChair: false,
    };
    const board = { ...state.board };
    board[from] = { ...board[from]!, occupants: [guest] };
    state = {
      ...state,
      characters: chars,
      board,
      subPhase: 'FIRST_MOVE',
      lastDiceRoll: makeDiceRoll(1, 2),
      pipsRemaining: 1,
      movementPlan: 'SPLIT',
      movesUsedThisTurn: 0,
    };

    const next = moveCharacter(state, {
      type:      'MOVE_PAWN',
      eventId:   'evt-sp',
      gameId:    state.gameId,
      playerId:  'p1',
      timestamp: '2026-06-01T00:00:00Z',
      payload: {
        characterId: guest,
        fromCell:    from,
        toCell:      to,
        pipsUsed:    1,
        path:        [from, to],
      },
    });

    expect(next.characters[guest]!.position).toBe(to);
  });

  it('builds extended deck when EXTENDED_TRAP_DECK module is enabled', () => {
    const state = initializeGame(
      'ext-deck',
      ['p1', 'p2'],
      { p1: 'A', p2: 'B' },
      { ruleProfile: 'ADVANCED', enabledModules: ['EXTENDED_TRAP_DECK'] },
    );
    expect(state.deck).toHaveLength(29);
    expect(state.deck[0]?.cardId.startsWith('ext-')).toBe(true);
  });
});
