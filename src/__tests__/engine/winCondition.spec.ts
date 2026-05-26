/**
 * winCondition.spec.ts
 * 10 unit tests for the winCondition engine module.
 *
 * Tests cover:
 *   1. Instant Heir Victory (escaped heir)                 (3 cases)
 *   2. Simultaneous Race Condition (priority matrix)       (3 cases)
 *   3. Empty Heir Paradox (neutral heir in unused deck)    (2 cases)
 *   4. LAST_ALIVE victory (player elimination check)       (2 cases)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { checkWinCondition, evaluateWinCondition } from '../../engine/winCondition.js';
import type { GameState } from '../../types/game-state.js';
import {
  makeGameState,
  makeCharacter,
  makeCell,
  makeDetective,
  makePortrait,
  PLAYER_A_ID,
  PLAYER_B_ID,
} from '../fixtures/gameState.fixtures.js';

describe('winCondition Resolution Engine', () => {
  let state: GameState;

  beforeEach(() => {
    state = makeGameState();
  });

  // ── 1. Instant Heir Victory ───────────────────────────────────────────────

  describe('Instant Heir Victory', () => {
    it('declares HEIR_ESCAPED victory for the owner when the active heir lands on EXIT_DOOR', () => {
      // CHARITY is the portrait heir and controlled by PLAYER_A_ID
      const stateWithHeirAtExit = makeGameState({
        characters: {
          ...makeGameState().characters,
          CHARITY: makeCharacter({
            id:             'CHARITY',
            position:       'EXIT_DOOR',
            status:         'ALIVE',
            controlledBy:   PLAYER_A_ID,
            isPortraitHeir: true,
          }),
        },
        board: {
          ...makeGameState().board,
          EXIT_DOOR: makeCell({ cellId: 'EXIT_DOOR', cellType: 'EXIT', occupants: ['CHARITY'] }),
        },
      });

      const resolution = checkWinCondition(stateWithHeirAtExit);
      expect(resolution.hasEnded).toBe(true);
      expect(resolution.winner).toBe(PLAYER_A_ID);
      expect(resolution.winCondition).toBe('HEIR_ESCAPED');

      // Verify evaluateWinCondition updates GameState immutably
      const nextState = evaluateWinCondition(stateWithHeirAtExit);
      expect(nextState.phase).toBe('GAME_OVER');
      expect(nextState.winner).toBe(PLAYER_A_ID);
      expect(nextState.winCondition).toBe('HEIR_ESCAPED');
    });

    it('does not declare victory if a non-heir lands on EXIT_DOOR', () => {
      // SMOTHERS is alive, controlled by Player A, but NOT the portrait heir (CHARITY is heir)
      const stateWithNonHeirAtExit = makeGameState({
        characters: {
          ...makeGameState().characters,
          SMOTHERS: makeCharacter({
            id:             'SMOTHERS',
            position:       'EXIT_DOOR',
            status:         'ALIVE',
            controlledBy:   PLAYER_A_ID,
            isPortraitHeir: false,
          }),
        },
        board: {
          ...makeGameState().board,
          EXIT_DOOR: makeCell({ cellId: 'EXIT_DOOR', cellType: 'EXIT', occupants: ['SMOTHERS'] }),
        },
      });

      const resolution = checkWinCondition(stateWithNonHeirAtExit);
      expect(resolution.hasEnded).toBe(false);
      expect(resolution.winner).toBeNull();
      expect(resolution.winCondition).toBeNull();
    });

    it('returns existing winner if game phase is already GAME_OVER', () => {
      const gameOverState = makeGameState({
        phase:        'GAME_OVER',
        winner:       PLAYER_B_ID,
        winCondition: 'LAST_ALIVE',
      });
      const resolution = checkWinCondition(gameOverState);
      expect(resolution.hasEnded).toBe(true);
      expect(resolution.winner).toBe(PLAYER_B_ID);
      expect(resolution.winCondition).toBe('LAST_ALIVE');
    });
  });

  // ── 2. Simultaneous Race Condition ────────────────────────────────────────

  describe('Simultaneous Race Condition (Priority Matrix)', () => {
    it('prioritizes HEIR_ESCAPED over detective max capacity when both trigger on the same turn', () => {
      // CHARITY (heir, Player A) lands on EXIT_DOOR
      // AND detective position is also at max steps (representing exit reached)
      const stateDoubleWin = makeGameState({
        characters: {
          ...makeGameState().characters,
          CHARITY: makeCharacter({
            id:             'CHARITY',
            position:       'EXIT_DOOR',
            status:         'ALIVE',
            controlledBy:   PLAYER_A_ID,
            isPortraitHeir: true,
          }),
        },
        board: {
          ...makeGameState().board,
          EXIT_DOOR: makeCell({ cellId: 'EXIT_DOOR', cellType: 'EXIT', occupants: ['CHARITY'] }),
        },
        detectivePosition: makeDetective({ currentStep: 10, maxSteps: 10, isAtExit: true }),
      });

      const resolution = checkWinCondition(stateDoubleWin);
      // Priority Rule: HEIR_ESCAPED wins immediately before detective checks
      expect(resolution.hasEnded).toBe(true);
      expect(resolution.winner).toBe(PLAYER_A_ID);
      expect(resolution.winCondition).toBe('HEIR_ESCAPED');
    });

    it('resolves to LAST_ALIVE detective win if no character escaped but detective is at exit', () => {
      // Detective reaches exit, no character is at EXIT_DOOR
      const stateDetectiveWin = makeGameState({
        detectivePosition: makeDetective({ currentStep: 10, maxSteps: 10, isAtExit: true }),
        // CHARITY and SMOTHERS are alive at FOYER/B2
      });

      // After advanceDetective applies mass elimination, phase is set to GAME_OVER and winner resolved
      const stateAfterMassElim = makeGameState({
        phase:             'GAME_OVER',
        winner:            PLAYER_A_ID,
        winCondition:      'LAST_ALIVE',
        detectivePosition: makeDetective({ currentStep: 10, maxSteps: 10, isAtExit: true }),
      });

      const resolution = checkWinCondition(stateAfterMassElim);
      expect(resolution.hasEnded).toBe(true);
      expect(resolution.winner).toBe(PLAYER_A_ID);
      expect(resolution.winCondition).toBe('LAST_ALIVE');
    });

    it('does not declare HEIR_ESCAPED if an ELIMINATED heir character is somehow at exit', () => {
      const stateLethalExit = makeGameState({
        characters: {
          ...makeGameState().characters,
          CHARITY: makeCharacter({
            id:             'CHARITY',
            position:       'EXIT_DOOR',
            status:         'ELIMINATED',
            controlledBy:   PLAYER_A_ID,
            isPortraitHeir: true,
          }),
        },
        board: {
          ...makeGameState().board,
          EXIT_DOOR: makeCell({ cellId: 'EXIT_DOOR', cellType: 'EXIT', occupants: [] }),
        },
      });

      const resolution = checkWinCondition(stateLethalExit);
      expect(resolution.hasEnded).toBe(false);
      expect(resolution.winner).toBeNull();
    });
  });

  // ── 3. Empty Heir Paradox ─────────────────────────────────────────────────

  describe('The Empty Heir Paradox', () => {
    it('continues smoothly when the active heir is neutral and owned by no player (controlledBy is null)', () => {
      // PARKER is neutral (controlledBy: null) and is Portrait Heir
      const stateNeutralHeir = makeGameState({
        activePortrait: makePortrait('PARKER'),
        characters: {
          ...makeGameState().characters,
          PARKER: makeCharacter({
            id:             'PARKER',
            status:         'ALIVE',
            controlledBy:   null,
            isPortraitHeir: true,
          }),
          CHARITY: makeCharacter({
            id:             'CHARITY',
            status:         'ALIVE',
            controlledBy:   PLAYER_A_ID,
            isPortraitHeir: false,
          }),
        },
      });

      const resolution = checkWinCondition(stateNeutralHeir);
      expect(resolution.hasEnded).toBe(false);
      expect(resolution.winner).toBeNull();
      expect(resolution.winCondition).toBeNull();
    });

    it('does not award HEIR_ESCAPED if the neutral heir reaches EXIT_DOOR (since no player controls it)', () => {
      const stateNeutralEscape = makeGameState({
        activePortrait: makePortrait('PARKER'),
        characters: {
          ...makeGameState().characters,
          PARKER: makeCharacter({
            id:             'PARKER',
            position:       'EXIT_DOOR',
            status:         'ALIVE',
            controlledBy:   null,
            isPortraitHeir: true,
          }),
        },
        board: {
          ...makeGameState().board,
          EXIT_DOOR: makeCell({ cellId: 'EXIT_DOOR', cellType: 'EXIT', occupants: ['PARKER'] }),
        },
      });

      const resolution = checkWinCondition(stateNeutralEscape);
      // Neutral character escaping does not trigger a player victory
      expect(resolution.hasEnded).toBe(false);
      expect(resolution.winner).toBeNull();
    });
  });

  // ── 4. LAST_ALIVE victory ──────────────────────────────────────────────────

  describe('LAST_ALIVE Victory', () => {
    it('declares LAST_ALIVE victory for Player A when Player B is fully eliminated', () => {
      // Player B (DUSTY) is eliminated, Player A (SMOTHERS) is alive
      const stateOneLeft = makeGameState({
        players: {
          [PLAYER_A_ID]: {
            ...makeGameState().players[PLAYER_A_ID] as any,
            isEliminated: false,
          },
          [PLAYER_B_ID]: {
            ...makeGameState().players[PLAYER_B_ID] as any,
            isEliminated: true,
          },
        },
        characters: {
          ...makeGameState().characters,
          DUSTY: makeCharacter({ id: 'DUSTY', status: 'ELIMINATED', controlledBy: PLAYER_B_ID }),
          SMOTHERS:   makeCharacter({ id: 'SMOTHERS',   status: 'ALIVE', controlledBy: PLAYER_A_ID }),
        },
      });

      const resolution = checkWinCondition(stateOneLeft);
      expect(resolution.hasEnded).toBe(true);
      expect(resolution.winner).toBe(PLAYER_A_ID);
      expect(resolution.winCondition).toBe('LAST_ALIVE');
    });

    it('does not declare LAST_ALIVE if multiple players still have alive characters', () => {
      // Both Player A and Player B have alive characters
      const resolution = checkWinCondition(state);
      expect(resolution.hasEnded).toBe(false);
      expect(resolution.winner).toBeNull();
    });
  });
});
