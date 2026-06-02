/**
 * turnOrchestrator.spec.ts
 * Rebuilt unit tests for the turnOrchestrator engine module.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { processTurn } from '../../engine/turnOrchestrator.js';
import { initializeGame } from '../../engine/gameInitializer.js';
import { EngineError } from '../../engine/EngineError.js';
import type { GameState } from '../../types/game-state.js';
import type { SocketEvent } from '../../types/socket-events.js';
import type { SocketErrorCode } from '../../types/enums.js';
import {
  makeGameState,
  makeDiceRoll,
  PLAYER_A_ID,
  PLAYER_B_ID,
  GAME_ID,
} from '../fixtures/gameState.fixtures.js';

function expectEngineError(fn: () => unknown, code: SocketErrorCode): void {
  let caught: unknown;
  try { fn(); } catch (e) { caught = e; }
  expect(caught, `Expected EngineError with code '${code}'`).toBeInstanceOf(EngineError);
  expect((caught as EngineError).code).toBe(code);
}

function makeMoveEvent(
  characterId: import('../../types/enums.js').CharacterId,
  fromCell: string,
  toCell: string,
  pips: number,
  playerId: string = PLAYER_A_ID,
): SocketEvent {
  return {
    type:      'MOVE_PAWN',
    eventId:   `evt-orch-move-${characterId}`,
    gameId:    GAME_ID,
    playerId,
    timestamp: '2026-05-23T03:00:00Z',
    payload: {
      characterId,
      fromCell,
      toCell,
      pipsUsed: pips as any,
      path:     [fromCell, toCell],
    },
  };
}

describe('turnOrchestrator', () => {
  let state: GameState;

  beforeEach(() => {
    state = {
      ...makeGameState(),
      subPhase: 'AWAITING_ROLL',
      lastDiceRoll: null,
    };
  });

  describe('Turn & Phase Transitions', () => {
    it('ROLL_DICE transitions to FIRST_MOVE subPhase', () => {
      const event: SocketEvent = {
        type: 'ROLL_DICE',
        eventId: 'evt-roll-1',
        gameId: GAME_ID,
        playerId: PLAYER_A_ID,
        timestamp: '2026-05-23T03:00:00Z',
      };

      const nextState = processTurn(state, event);
      expect(nextState.subPhase).toBe('FIRST_MOVE');
      expect(nextState.lastDiceRoll).not.toBeNull();
      expect(nextState.pipsRemaining).toBe(nextState.lastDiceRoll!.die1);
    });

    it('CHANGE_PORTRAIT on doubles rotates the heir', () => {
      const doublesState: GameState = {
        ...state,
        subPhase: 'FIRST_MOVE',
        lastDiceRoll: makeDiceRoll(3, 3, PLAYER_A_ID),
        movesUsedThisTurn: 0,
      };

      const event: SocketEvent = {
        type: 'CHANGE_PORTRAIT',
        eventId: 'evt-change-1',
        gameId: GAME_ID,
        playerId: PLAYER_A_ID,
        timestamp: '2026-05-23T03:00:00Z',
      };

      const originalHeir = doublesState.activePortrait.currentHeirId;
      const nextState = processTurn(doublesState, event);

      expect(nextState.activePortrait.currentHeirId).not.toBe(originalHeir);
      expect(nextState.activePortrait.lastChangedReason).toBe('DOUBLES_ROLL');
      const heirId = nextState.activePortrait.currentHeirId;
      if (heirId !== 'AUNT_AGATHA') {
        expect(nextState.characters[heirId]!.isPortraitHeir).toBe(true);
      }
      if (originalHeir !== 'AUNT_AGATHA') {
        expect(nextState.characters[originalHeir]!.isPortraitHeir).toBe(false);
      }
    });

    it('throws INVALID_MOVE when CHANGE_PORTRAIT is called without doubles', () => {
      const normalState: GameState = {
        ...state,
        subPhase: 'FIRST_MOVE',
        lastDiceRoll: makeDiceRoll(3, 2, PLAYER_A_ID),
        movesUsedThisTurn: 0,
      };

      const event: SocketEvent = {
        type: 'CHANGE_PORTRAIT',
        eventId: 'evt-change-2',
        gameId: GAME_ID,
        playerId: PLAYER_A_ID,
        timestamp: '2026-05-23T03:00:00Z',
      };

      expectEngineError(() => processTurn(normalState, event), 'INVALID_MOVE');
    });

    it('movement transitions from FIRST_MOVE to SECOND_MOVE when no trap is hit', () => {
      const rolledState: GameState = {
        ...state,
        subPhase: 'FIRST_MOVE',
        lastDiceRoll: makeDiceRoll(1, 2, PLAYER_A_ID),
        pipsRemaining: 1,
      };

      // Move SMOTHERS from RC_1 to HALL_1 (RC_2 is occupied by DUSTY)
      const event = makeMoveEvent('SMOTHERS', 'RC_1', 'HALL_1', 1, PLAYER_A_ID);
      const nextState = processTurn(rolledState, event);

      expect(nextState.subPhase).toBe('SECOND_MOVE');
      expect(nextState.movesUsedThisTurn).toBe(1);
      expect(nextState.pipsRemaining).toBe(2);
      expect(nextState.activePlayerId).toBe(PLAYER_A_ID); // Turn hasn't rotated yet
    });

    it('second movement wraps up and rotates turn to Player B', () => {
      const secondState: GameState = {
        ...state,
        subPhase: 'SECOND_MOVE',
        lastDiceRoll: makeDiceRoll(1, 2, PLAYER_A_ID),
        movesUsedThisTurn: 1,
        pipsRemaining: 2,
        board: {
          ...state.board,
          RC_3: {
            ...state.board.RC_3!,
            occupants: [],
          },
          RC_4: {
            ...state.board.RC_4!,
            occupants: [],
          },
        },
      };

      // Move DUSTY from RC_2 to RC_4 via RC_3 (die2 = 2 pips; may pass over CHARITY on RC_3)
      const event: SocketEvent = {
        type:      'MOVE_PAWN',
        eventId:   'evt-orch-move-annette',
        gameId:    GAME_ID,
        playerId:  PLAYER_A_ID,
        timestamp: '2026-05-23T03:00:00Z',
        payload: {
          characterId: 'DUSTY',
          fromCell:    'RC_2',
          toCell:      'RC_4',
          pipsUsed:    2,
          path:        ['RC_2', 'RC_3', 'RC_4'],
        },
      };
      const nextState = processTurn(secondState, event);

      expect(nextState.characters.DUSTY!.position).toBe('RC_4');
      expect(nextState.subPhase).toBe('AWAITING_ROLL');
      expect(nextState.activePlayerId).toBe(PLAYER_B_ID);
      expect(nextState.movesUsedThisTurn).toBe(0);
      expect(nextState.lastDiceRoll).toBeNull();
    });

    it('processes turns when ruleProfile is ADVANCED with no modules enabled', () => {
      const advanced = initializeGame(
        'orch-advanced',
        ['p1', 'p2'],
        { p1: 'A', p2: 'B' },
        { ruleProfile: 'ADVANCED', enabledModules: [] },
      );
      const rollEvent: SocketEvent = {
        type:      'ROLL_DICE',
        eventId:   'evt-adv-roll',
        gameId:    advanced.gameId,
        playerId:  'p1',
        timestamp: '2026-05-23T03:00:00Z',
      };
      const rolled = processTurn(advanced, rollEvent);
      expect(rolled.subPhase).toBe('FIRST_MOVE');
      expect(rolled.ruleProfile).toBe('ADVANCED');
    });

    it('throws GAME_ALREADY_OVER when processing turn after game ends', () => {
      const finishedState: GameState = {
        ...state,
        phase: 'GAME_OVER',
        winner: PLAYER_A_ID,
        winCondition: 'LAST_ALIVE',
      };

      const event = makeMoveEvent('SMOTHERS', 'RC_1', 'RC_2', 1, PLAYER_A_ID);
      expectEngineError(() => processTurn(finishedState, event), 'GAME_ALREADY_OVER');
    });
  });
});
