/**
 * trapEvaluator.spec.ts
 * Comprehensive unit tests for the trapEvaluator engine.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { resolveTrapCard, resolveDrawCard, resolveTrapDecline, fireTrap } from '../../engine/trapEvaluator.js';
import { EngineError }      from '../../engine/EngineError.js';
import type { GameState }   from '../../types/game-state.js';
import type { PlayTrapCardEvent } from '../../types/socket-events.js';
import type { SocketErrorCode, CharacterId } from '../../types/enums.js';
import {
  makeGameState,
  makeDiceRoll,
  PLAYER_A_ID,
  PLAYER_B_ID,
  GAME_ID,
  CARD_CHANDELIER,
  CARD_FIREPLACE,
  CARD_WILD,
  CARD_DETECTIVE,
} from '../fixtures/gameState.fixtures.js';

function expectEngineError(fn: () => unknown, code: SocketErrorCode): void {
  let caught: unknown;
  try { fn(); } catch (e) { caught = e; }
  expect(caught, `Expected EngineError with code '${code}'`).toBeInstanceOf(EngineError);
  expect((caught as EngineError).code).toBe(code);
}

describe('trapEvaluator', () => {
  let state: GameState;

  beforeEach(() => {
    // Player A has CARD_CHANDELIER and CARD_WILD
    // Player B has CARD_FIREPLACE
    state = makeGameState({
      subPhase: 'AWAITING_TRAP_1',
      pendingTrapCell: 'CHAND_TRAP',
      pendingTrapHandCardIds: [CARD_CHANDELIER.cardId, CARD_WILD.cardId],
      pendingTrapDrawnCardId: null,
      lastDiceRoll: makeDiceRoll(1, 2, PLAYER_A_ID),
    });
  });

  describe('resolveTrapCard', () => {
    it('throws CARD_NOT_IN_HAND when playing a card not in player hand', () => {
      const event: PlayTrapCardEvent = {
        type: 'PLAY_TRAP_CARD',
        eventId: 'evt-1',
        gameId: GAME_ID,
        playerId: PLAYER_A_ID,
        timestamp: '2026-05-23T02:00:00Z',
        payload: {
          cardId: 'nonexistent-card-id',
          cardType: 'TRAP_CARD',
          targetCell: 'CHAND_TRAP',
        },
      };

      expectEngineError(() => resolveTrapCard(state, event), 'CARD_NOT_IN_HAND');
    });

    it('throws WRONG_TRAP_CARD when playing a card that does not match the pending trap', () => {
      // Player A has CARD_CHANDELIER and CARD_WILD. Let's make Player A try to play CARD_FIREPLACE which they don't have, or another player's card.
      // Wait, let's put CARD_FIREPLACE in Player A's hand first so it passes hand check, but fails trap check.
      const stateWithCard = {
        ...state,
        players: {
          ...state.players,
          [PLAYER_A_ID]: {
            ...state.players[PLAYER_A_ID]!,
            hand: [CARD_FIREPLACE],
          },
        },
      };

      const event: PlayTrapCardEvent = {
        type: 'PLAY_TRAP_CARD',
        eventId: 'evt-2',
        gameId: GAME_ID,
        playerId: PLAYER_A_ID,
        timestamp: '2026-05-23T02:00:00Z',
        payload: {
          cardId: CARD_FIREPLACE.cardId,
          cardType: 'TRAP_CARD',
          targetCell: 'CHAND_TRAP',
        },
      };

      expectEngineError(() => resolveTrapCard(stateWithCard, event), 'WRONG_TRAP_CARD');
    });

    it('successfully springs trap with matching card, eliminating occupants and discarding card', () => {
      // Put CHARITY on the Chandelier trap cell
      const updatedState = {
        ...state,
        characters: {
          ...state.characters,
          CHARITY: {
            ...state.characters.CHARITY!,
            position: 'CHAND_TRAP',
          },
        },
        board: {
          ...state.board,
          CHAND_TRAP: {
            ...state.board.CHAND_TRAP!,
            occupants: ['CHARITY' as CharacterId],
          },
        },
      };

      const event: PlayTrapCardEvent = {
        type: 'PLAY_TRAP_CARD',
        eventId: 'evt-3',
        gameId: GAME_ID,
        playerId: PLAYER_A_ID,
        timestamp: '2026-05-23T02:00:00Z',
        payload: {
          cardId: CARD_CHANDELIER.cardId,
          cardType: 'TRAP_CARD',
          targetCell: 'CHAND_TRAP',
        },
      };

      const nextState = resolveTrapCard(updatedState, event);

      expect(nextState.characters.CHARITY!.status).toBe('ELIMINATED');
      expect(nextState.traps.CHANDELIER!.state).toBe('SPENT');
      expect(nextState.players[PLAYER_A_ID]!.hand.map(c => c.cardId)).not.toContain(CARD_CHANDELIER.cardId);
      expect(nextState.discardPile.map(c => c.cardId)).toContain(CARD_CHANDELIER.cardId);
      expect(nextState.pendingTrapCell).toBeNull();
      expect(nextState.subPhase).toBe('SECOND_MOVE');
    });

    it('successfully springs trap with WILD card', () => {
      const updatedState = {
        ...state,
        characters: {
          ...state.characters,
          CHARITY: {
            ...state.characters.CHARITY!,
            position: 'CHAND_TRAP',
          },
        },
        board: {
          ...state.board,
          CHAND_TRAP: {
            ...state.board.CHAND_TRAP!,
            occupants: ['CHARITY' as CharacterId],
          },
        },
      };

      const event: PlayTrapCardEvent = {
        type: 'PLAY_TRAP_CARD',
        eventId: 'evt-4',
        gameId: GAME_ID,
        playerId: PLAYER_A_ID,
        timestamp: '2026-05-23T02:00:00Z',
        payload: {
          cardId: CARD_WILD.cardId,
          cardType: 'WILD_CARD',
          targetCell: 'CHAND_TRAP',
        },
      };

      const nextState = resolveTrapCard(updatedState, event);

      expect(nextState.characters.CHARITY!.status).toBe('ELIMINATED');
      expect(nextState.traps.CHANDELIER!.state).toBe('SPENT');
      expect(nextState.players[PLAYER_A_ID]!.hand.map(c => c.cardId)).not.toContain(CARD_WILD.cardId);
      expect(nextState.pendingTrapCell).toBeNull();
    });
  });

  describe('resolveDrawCard', () => {
    it('ends trap resolution when a non-matching trap card is drawn', () => {
      const drawDeck = [CARD_FIREPLACE];
      const testState = {
        ...state,
        deck: drawDeck,
      };

      const nextState = resolveDrawCard(testState, PLAYER_A_ID, '2026-05-23T02:00:00Z');

      expect(nextState.players[PLAYER_A_ID]!.hand.map(c => c.cardId)).toContain(CARD_FIREPLACE.cardId);
      expect(nextState.pendingTrapCell).toBeNull();
      expect(nextState.subPhase).toBe('SECOND_MOVE');
    });

    it('allows only the drawn matching card to spring the trap after a draw', () => {
      const drawDeck = [CARD_CHANDELIER];
      const afterDraw = resolveDrawCard(
        { ...state, deck: drawDeck },
        PLAYER_A_ID,
        '2026-05-23T02:00:00Z',
      );

      expect(afterDraw.pendingTrapDrawnCardId).toBe(CARD_CHANDELIER.cardId);
      expectEngineError(() => resolveTrapCard(afterDraw, {
        type: 'PLAY_TRAP_CARD',
        eventId: 'evt-wild-block',
        gameId: GAME_ID,
        playerId: PLAYER_A_ID,
        timestamp: '2026-05-23T02:00:00Z',
        payload: {
          cardId: CARD_WILD.cardId,
          cardType: 'WILD_CARD',
          targetCell: 'CHAND_TRAP',
        },
      }), 'INVALID_MOVE');
    });

    it('advances detective and redraws until a trap card is resolved', () => {
      const drawDeck = [CARD_DETECTIVE, CARD_FIREPLACE];
      const testState = {
        ...state,
        deck: drawDeck,
      };

      const nextState = resolveDrawCard(testState, PLAYER_A_ID, '2026-05-23T02:00:00Z');

      expect(nextState.detectivePosition.currentStep).toBe(1);
      expect(nextState.pendingTrapCell).toBeNull();
      expect(nextState.discardPile.map(c => c.cardId)).toContain(CARD_DETECTIVE.cardId);
      expect(nextState.players[PLAYER_A_ID]!.hand.map(c => c.cardId)).toContain(CARD_FIREPLACE.cardId);
    });
  });

  describe('resolveTrapDecline', () => {
    it('resumes turn without firing trap', () => {
      const nextState = resolveTrapDecline(state, PLAYER_A_ID, '2026-05-23T02:00:00Z');

      expect(nextState.traps.CHANDELIER!.state).toBe('READY');
      expect(nextState.pendingTrapCell).toBeNull();
      expect(nextState.subPhase).toBe('SECOND_MOVE');
    });
  });
});
