// dispatchGameEvent.spec.ts — single client ingress
import { describe, it, expect } from 'vitest';
import { dispatchGameEvent } from '../../client/session/dispatchGameEvent.js';
import { SoloSession } from '../../client/session/SoloSession.js';
import { makeGameState } from '../fixtures/gameState.fixtures.js';
import type { SocketEvent } from '../../types/socket-events.js';

describe('dispatchGameEvent', () => {
  it('applies roll via solo session', () => {
    const state = makeGameState({ subPhase: 'AWAITING_ROLL' });
    const session = new SoloSession(state);
    const event: SocketEvent = {
      type: 'ROLL_DICE',
      eventId: crypto.randomUUID(),
      gameId: state.gameId,
      playerId: state.activePlayerId,
      timestamp: new Date().toISOString(),
    };
    const next = dispatchGameEvent({ session, gameState: state }, event);
    expect(next?.lastDiceRoll).not.toBeNull();
  });
});
