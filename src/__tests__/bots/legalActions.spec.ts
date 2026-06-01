// legalActions.spec.ts — enumerateLegalActions

import { describe, expect, it } from 'vitest';
import { enumerateLegalActions } from '../../bots/legalActions.js';
import { processTurn } from '../../engine/turnOrchestrator.js';
import { buildSocketEvent } from '../../bots/buildBotEvent.js';
import {
  makeGameState,
  makeFirstMoveState,
  PLAYER_A_ID,
  PLAYER_B_ID,
} from '../fixtures/gameState.fixtures.js';

describe('enumerateLegalActions', () => {
  it('offers ROLL_DICE when awaiting roll', () => {
    const state = makeGameState({ subPhase: 'AWAITING_ROLL' });
    const legal = enumerateLegalActions(state, PLAYER_A_ID);
    expect(legal).toHaveLength(1);
    expect(legal[0]!.kind).toBe('ROLL_DICE');
  });

  it('returns empty when not active player', () => {
    const state = makeGameState({ activePlayerId: PLAYER_B_ID });
    const legal = enumerateLegalActions(state, PLAYER_A_ID);
    expect(legal).toHaveLength(0);
  });

  it('includes COMBINED movement plan after roll', () => {
    const state = makeFirstMoveState(3, 4);
    const legal = enumerateLegalActions(state, PLAYER_A_ID);
    const plans = legal.filter((a) => a.kind === 'CHOOSE_MOVEMENT_PLAN');
    expect(plans.some((p) => p.summary.includes('combined'))).toBe(true);
  });

  it('generated ROLL_DICE applies via processTurn', () => {
    const state = makeGameState({ subPhase: 'AWAITING_ROLL' });
    const legal = enumerateLegalActions(state, PLAYER_A_ID);
    const event = buildSocketEvent(legal[0]!.event, state.gameId, PLAYER_A_ID);
    const next = processTurn(state, event);
    expect(next.subPhase).toBe('FIRST_MOVE');
    expect(next.lastDiceRoll).not.toBeNull();
  });
});
