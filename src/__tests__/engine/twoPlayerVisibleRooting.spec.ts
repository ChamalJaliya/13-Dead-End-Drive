// twoPlayerVisibleRooting.spec.ts — G01: all rooting guests visible (no secret deal)

import { describe, it, expect } from 'vitest';
import { initializeGame } from '../../engine/gameInitializer.js';
import { checkWinCondition, evaluateWinCondition } from '../../engine/winCondition.js';
import { resolveCharacterOwner, playerHasLivingRootedCharacter } from '../../engine/characterOwnership.js';
import {
  makeGameState,
  makeCharacter,
  makeCell,
  makePortrait,
  makePlayer,
  PLAYER_A_ID,
  PLAYER_B_ID,
} from '../fixtures/gameState.fixtures.js';
import { CHARACTER_IDS } from '../../types/enums.js';

describe('two-player visible rooting (G01)', () => {
  it('deals six visible rooting guests per player and roots all twelve pawns', () => {
    const state = initializeGame('2p-visible', ['p1', 'p2'], { p1: 'A', p2: 'B' });
    expect(state.turnOrder).toHaveLength(2);
    expect(state.players['p1']!.characterIds).toHaveLength(6);
    expect(state.players['p2']!.characterIds).toHaveLength(6);
    expect(state.players['p1']!.secretCharacterIds).toHaveLength(0);
    expect(state.players['p2']!.hasHiddenSecretCard).toBe(false);

    const allRooted = new Set([
      ...state.players['p1']!.characterIds,
      ...state.players['p2']!.characterIds,
    ]);
    expect(allRooted.size).toBe(12);

    for (const charId of CHARACTER_IDS) {
      expect(state.characters[charId]!.controlledBy).not.toBeNull();
    }
  });

  it('does not assign secret cards in a three-player game', () => {
    const state = initializeGame('3p', ['p1', 'p2', 'p3'], { p1: 'A', p2: 'B', p3: 'C' });
    for (const pid of ['p1', 'p2', 'p3'] as const) {
      expect(state.players[pid]!.secretCharacterIds).toHaveLength(0);
      expect(state.players[pid]!.characterIds).toHaveLength(4);
    }
  });

  it('awards HEIR_ESCAPED to the rooting card holder for the portrait guest', () => {
    const state = makeGameState({
      turnOrder: [PLAYER_A_ID, PLAYER_B_ID],
      players: {
        [PLAYER_A_ID]: makePlayer(PLAYER_A_ID, ['SMOTHERS', 'CHARITY']),
        [PLAYER_B_ID]: makePlayer(PLAYER_B_ID, ['DUSTY']),
      },
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
      activePortrait: makePortrait('CHARITY'),
    });

    expect(resolveCharacterOwner(state, 'CHARITY')).toBe(PLAYER_A_ID);
    const resolution = checkWinCondition(state);
    expect(resolution.winCondition).toBe('HEIR_ESCAPED');
    expect(resolution.winner).toBe(PLAYER_A_ID);
  });

  it('counts a living rooted guest for LAST_ALIVE', () => {
    const state = makeGameState({
      turnOrder: [PLAYER_A_ID, PLAYER_B_ID],
      players: {
        [PLAYER_A_ID]: makePlayer(PLAYER_A_ID, ['SMOTHERS', 'CHARITY']),
        [PLAYER_B_ID]: makePlayer(PLAYER_B_ID, ['DUSTY']),
      },
      characters: {
        ...makeGameState().characters,
        SMOTHERS: makeCharacter({ id: 'SMOTHERS', status: 'ELIMINATED', controlledBy: PLAYER_A_ID }),
        DUSTY: makeCharacter({ id: 'DUSTY', status: 'ELIMINATED', controlledBy: PLAYER_B_ID }),
        CHARITY: makeCharacter({ id: 'CHARITY', status: 'ALIVE', controlledBy: PLAYER_A_ID }),
      },
    });

    expect(playerHasLivingRootedCharacter(state, PLAYER_A_ID)).toBe(true);
    expect(playerHasLivingRootedCharacter(state, PLAYER_B_ID)).toBe(false);

    const resolution = checkWinCondition(state);
    expect(resolution.winCondition).toBe('LAST_ALIVE');
    expect(resolution.winner).toBe(PLAYER_A_ID);
  });

  it('does not force secretCardsRevealed on game over', () => {
    const state = makeGameState({
      turnOrder: [PLAYER_A_ID, PLAYER_B_ID],
      secretCardsRevealed: false,
      players: {
        [PLAYER_A_ID]: makePlayer(PLAYER_A_ID, ['CHARITY']),
        [PLAYER_B_ID]: makePlayer(PLAYER_B_ID, ['DUSTY']),
      },
      characters: {
        ...makeGameState().characters,
        CHARITY: makeCharacter({
          id:           'CHARITY',
          position:     'EXIT_DOOR',
          status:       'ALIVE',
          controlledBy: PLAYER_A_ID,
          isPortraitHeir: true,
        }),
      },
      board: {
        ...makeGameState().board,
        EXIT_DOOR: makeCell({ cellId: 'EXIT_DOOR', cellType: 'EXIT', occupants: ['CHARITY'] }),
      },
    });

    const ended = evaluateWinCondition(state);
    expect(ended.phase).toBe('GAME_OVER');
    expect(ended.secretCardsRevealed).toBe(false);
  });
});
