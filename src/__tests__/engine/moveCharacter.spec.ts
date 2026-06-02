/**
 * moveCharacter.spec.ts
 * Rebuilt unit tests for the moveCharacter engine function under the real rules.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { moveCharacter }   from '../../engine/moveCharacter.js';
import { EngineError }     from '../../engine/EngineError.js';
import type { GameState }     from '../../types/game-state.js';
import type { MovePawnEvent } from '../../types/socket-events.js';
import type { SocketErrorCode } from '../../types/enums.js';
import {
  makeGameState,
  makeDiceRoll,
  makeFirstMoveState,
  PLAYER_A_ID,
  PLAYER_B_ID,
  GAME_ID,
} from '../fixtures/gameState.fixtures.js';

function makeMovePawnEvent(
  overrides: Partial<MovePawnEvent['payload']> & { playerId?: string } = {},
): MovePawnEvent {
  const { playerId = PLAYER_A_ID, ...payloadOverrides } = overrides;
  return {
    type:      'MOVE_PAWN',
    eventId:   'evt-move-test-001',
    gameId:    GAME_ID,
    playerId,
    timestamp: '2026-05-23T02:05:00Z',
    payload: {
      characterId: 'SMOTHERS',
      fromCell:    'RC_1',
      toCell:      'RC_2',
      pipsUsed:    1,
      path:        ['RC_1', 'RC_2'],
      ...payloadOverrides,
    },
  };
}

function expectEngineError(fn: () => unknown, code: SocketErrorCode): void {
  let caught: unknown;
  try { fn(); } catch (e) { caught = e; }
  expect(caught, `Expected EngineError with code '${code}' to be thrown`).toBeInstanceOf(EngineError);
  expect((caught as EngineError).code).toBe(code);
}

describe('moveCharacter', () => {
  let state: GameState;

  beforeEach(() => {
    // Setup state in FIRST_MOVE subphase
    state = {
      ...makeGameState(),
      subPhase: 'FIRST_MOVE',
      lastDiceRoll: makeDiceRoll(1, 2, PLAYER_A_ID),
    };
  });

  describe('movement validations', () => {
    it('throws INVALID_MOVE when path contains a non-adjacent hop', () => {
      // RC_1 and LIBRARY share no edge in the board adjacency graph
      const event = makeMovePawnEvent({
        toCell:   'LIBRARY',
        path:     ['RC_1', 'LIBRARY'],
        pipsUsed: 1,
      });
      expectEngineError(() => moveCharacter(state, event), 'INVALID_MOVE');
    });

    it('throws INVALID_MOVE when pipsUsed exceeds the movement die value', () => {
      // movementDie = 3, attempting 4-step path
      const event = makeMovePawnEvent({
        toCell:   'RC_11',
        path:     ['RC_1', 'RC_2', 'RC_3', 'RC_4', 'RC_10', 'RC_11'],
        pipsUsed: 5,
      });
      expectEngineError(() => moveCharacter(state, event), 'INVALID_MOVE');
    });

    it('throws INVALID_MOVE when path contains duplicate cells (looping)', () => {
      const event = makeMovePawnEvent({
        toCell:   'RC_2',
        path:     ['RC_1', 'RC_2', 'RC_1', 'RC_2'],
        pipsUsed: 3,
      });
      expectEngineError(() => moveCharacter(state, event), 'INVALID_MOVE');
    });

    it('allows any player to move any character (including opponents)', () => {
      // PLAYER_A legally moves DUSTY (who is controlled by PLAYER_B), passing over SMOTHERS on RC_1
      const stateWithTwoPips = {
        ...state,
        lastDiceRoll: makeDiceRoll(2, 2, PLAYER_A_ID),
      };
      const event = makeMovePawnEvent({
        characterId: 'DUSTY',
        fromCell:    'RC_2',
        toCell:      'HALL_1',
        path:        ['RC_2', 'RC_1', 'HALL_1'],
        pipsUsed:    2,
      });
      const nextState = moveCharacter(stateWithTwoPips, event);
      expect(nextState.characters.DUSTY!.position).toBe('HALL_1');
    });

    it('throws INVALID_MOVE when attempting to move an ELIMINATED character', () => {
      const event = makeMovePawnEvent({
        characterId: 'LULU', // ELIMINATED in mock
        fromCell:    'FOYER',
        toCell:      'FRONT_HALL',
        path:        ['FOYER', 'FRONT_HALL'],
        pipsUsed:    1,
      });
      expectEngineError(() => moveCharacter(state, event), 'INVALID_MOVE');
    });

    it('returns a new GameState reference without mutating the input', () => {
      const stateWith1 = {
        ...state,
        lastDiceRoll: makeDiceRoll(1, 2, PLAYER_A_ID),
      };
      const event = makeMovePawnEvent({ toCell: 'HALL_1', path: ['RC_1', 'HALL_1'], pipsUsed: 1 });
      const nextState = moveCharacter(stateWith1, event);

      expect(nextState).not.toBe(stateWith1);
      expect(stateWith1.characters.SMOTHERS!.position).toBe('RC_1');
      expect(nextState.characters.SMOTHERS!.position).toBe('HALL_1');
      expect(nextState.characters.SMOTHERS!.isOnRedChair).toBe(false);
    });

    it('throws INVALID_MOVE when entering a trap directly from another trap cell', () => {
      const trapState: GameState = {
        ...makeFirstMoveState(1, 1),
        board: {
          ...makeGameState().board,
          TRAP_A: {
            cellId: 'TRAP_A', label: 'Trap A', cellType: 'TRAP_ZONE', gridCol: 0, gridRow: 0,
            occupants: ['SMOTHERS'], trapRef: 'CHANDELIER', isExitAdjacent: false,
            isRedChair: false, isSecretPassage: false, adjacentCells: ['TRAP_B'],
          },
          TRAP_B: {
            cellId: 'TRAP_B', label: 'Trap B', cellType: 'TRAP_ZONE', gridCol: 1, gridRow: 0,
            occupants: [], trapRef: 'FIREPLACE', isExitAdjacent: false,
            isRedChair: false, isSecretPassage: false, adjacentCells: ['TRAP_A'],
          },
        },
        characters: {
          ...makeGameState().characters,
          SMOTHERS: {
            ...makeGameState().characters.SMOTHERS!,
            position: 'TRAP_A',
            isOnRedChair: false,
          },
        },
      };

      const event = makeMovePawnEvent({
        characterId: 'SMOTHERS',
        fromCell:    'TRAP_A',
        toCell:      'TRAP_B',
        path:        ['TRAP_A', 'TRAP_B'],
        pipsUsed:    1,
      });

      expectEngineError(() => moveCharacter(trapState, event), 'INVALID_MOVE');
    });

    it('teleports between secret passages costing exactly 1 movement pip', () => {
      // Put SMOTHERS on SP_4, subPhase FIRST_MOVE, allowed pips = 1
      const spState: GameState = {
        ...state,
        subPhase: 'FIRST_MOVE',
        lastDiceRoll: makeDiceRoll(1, 2, PLAYER_A_ID),
        characters: {
          ...state.characters,
          SMOTHERS: {
            ...state.characters.SMOTHERS!,
            position: 'SP_4',
            isOnRedChair: false,
          },
        },
        board: {
          ...state.board,
          SP_4: {
            ...state.board.SP_4!,
            occupants: ['SMOTHERS'],
          },
        },
      };

      const event = makeMovePawnEvent({
        characterId: 'SMOTHERS',
        fromCell:    'SP_4',
        toCell:      'SP_5',
        path:        ['SP_4', 'SP_5'],
        pipsUsed:    1,
      });

      const nextState = moveCharacter(spState, event);
      expect(nextState.characters.SMOTHERS!.position).toBe('SP_5');
    });
  });
});
