// applyPlayerAction.spec.ts — GameSession dispatch gate
import { describe, it, expect, vi } from 'vitest';
import { applyPlayerAction } from '../../client/store/applyPlayerAction.js';
import { SoloSession } from '../../client/session/SoloSession.js';
import { OnlineSession } from '../../client/session/OnlineSession.js';
import { makeGameState } from '../fixtures/gameState.fixtures.js';
import type { SocketEvent } from '../../types/socket-events.js';

describe('applyPlayerAction', () => {
  it('runs processTurn in solo session', () => {
    const state = makeGameState({ subPhase: 'AWAITING_ROLL' });
    const event: SocketEvent = {
      type: 'ROLL_DICE',
      eventId: crypto.randomUUID(),
      gameId: state.gameId,
      playerId: state.activePlayerId,
      timestamp: new Date().toISOString(),
    };
    const session = new SoloSession(state);
    const next = applyPlayerAction(session, state, event);
    expect(next?.lastDiceRoll).not.toBeNull();
  });

  it('does not run processTurn in online session', () => {
    const state = makeGameState({ subPhase: 'AWAITING_ROLL' });
    const event: SocketEvent = {
      type: 'ROLL_DICE',
      eventId: crypto.randomUUID(),
      gameId: state.gameId,
      playerId: state.activePlayerId,
      timestamp: new Date().toISOString(),
    };
    const submitAction = vi.fn();
    const session = new OnlineSession({ submitAction } as never);
    session.applyServerState(state);
    const next = applyPlayerAction(session, state, event);
    expect(next).toBeNull();
    expect(submitAction).toHaveBeenCalledWith(event);
  });
});
