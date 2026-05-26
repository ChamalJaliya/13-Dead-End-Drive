// broadcastPipeline.secret.spec.ts — masks 2p secret cards until reveal

import { describe, it, expect } from 'vitest';
import { filterStateForPlayer } from '../../network/broadcastPipeline.js';
import { makeGameState, makePlayer, PLAYER_A_ID, PLAYER_B_ID } from '../fixtures/gameState.fixtures.js';

describe('filterStateForPlayer secret card masking', () => {
  it('hides secret character identity from all clients until secretCardsRevealed', () => {
    const state = makeGameState({
      turnOrder: [PLAYER_A_ID, PLAYER_B_ID],
      secretCardsRevealed: false,
      players: {
        [PLAYER_A_ID]: makePlayer(PLAYER_A_ID, ['SMOTHERS'], [], ['CHARITY']),
        [PLAYER_B_ID]: makePlayer(PLAYER_B_ID, ['DUSTY'], [], ['PARKER']),
      },
    });

    const forA = filterStateForPlayer(state, PLAYER_A_ID);
    // Owner sees their own secret card(s)
    expect(forA.players[PLAYER_A_ID]?.secretCharacterIds).toEqual(['CHARITY']);
    expect(forA.players[PLAYER_A_ID]?.hasHiddenSecretCard).toBe(false);
    expect(forA.players[PLAYER_B_ID]?.secretCharacterIds).toHaveLength(0);
    expect(forA.players[PLAYER_B_ID]?.hasHiddenSecretCard).toBe(true);
  });

  it('reveals both secret cards to every client after game over', () => {
    const state = makeGameState({
      turnOrder: [PLAYER_A_ID, PLAYER_B_ID],
      secretCardsRevealed: true,
      players: {
        [PLAYER_A_ID]: makePlayer(PLAYER_A_ID, ['SMOTHERS'], [], ['CHARITY']),
        [PLAYER_B_ID]: makePlayer(PLAYER_B_ID, ['DUSTY'], [], ['PARKER']),
      },
    });

    const forA = filterStateForPlayer(state, PLAYER_A_ID);
    expect(forA.players[PLAYER_A_ID]?.secretCharacterIds).toEqual(['CHARITY']);
    expect(forA.players[PLAYER_B_ID]?.secretCharacterIds).toEqual(['PARKER']);
  });
});
