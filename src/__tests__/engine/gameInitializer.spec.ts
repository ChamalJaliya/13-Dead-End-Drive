// gameInitializer.spec.ts — setup rules for original 13 Dead End Drive

import { describe, it, expect } from 'vitest';
import {
  initializeGame,
  gridChairSpawnNeedsRepair,
  repairGridChairSpawns,
} from '../../engine/gameInitializer.js';
import {
  GRID_21X15_DINING_CHAIR_CELLS,
  GRID_21X15_RED_CHAIRS,
} from '../../engine/boardDefinition.js';
import { CHARACTER_IDS } from '../../types/enums.js';
import { DETECTIVE_TRACK_MAX_STEPS } from '../../types/enums.js';
import { buildDeck } from '../../engine/cardDeck.js';

describe('gameInitializer', () => {
  it('places all twelve pawns on GRID_21X15 dining chairs', () => {
    const state = initializeGame('game-setup-1b', ['p1', 'p2'], { p1: 'A', p2: 'B' });
    const chairSet = new Set(GRID_21X15_RED_CHAIRS);
    for (const charId of CHARACTER_IDS) {
      const ch = state.characters[charId]!;
      expect(ch.isOnRedChair).toBe(true);
      expect(chairSet.has(ch.position)).toBe(true);
      expect(ch.status).toBe('ALIVE');
    }
  });

  it('repairs stale pawn positions onto the dining-chair ring', () => {
    const state = initializeGame('repair-chairs', ['p1', 'p2'], { p1: 'A', p2: 'B' });
    const stale = {
      ...state,
      characters: {
        ...state.characters,
        SMOTHERS: { ...state.characters.SMOTHERS!, position: 'G8', isOnRedChair: true },
        DUSTY: { ...state.characters.DUSTY!, position: 'H8', isOnRedChair: true },
      },
    };
    expect(gridChairSpawnNeedsRepair(stale)).toBe(true);
    const fixed = repairGridChairSpawns(stale);
    expect(fixed.characters.SMOTHERS!.position).toBe('J5');
    expect(fixed.characters.DUSTY!.position).toBe('J6');
    expect(gridChairSpawnNeedsRepair(fixed)).toBe(false);
  });

  it('marks exactly the twelve dining-chair cells as RED_CHAIR on the grid board', () => {
    const state = initializeGame('game-setup-chairs', ['p1', 'p2'], { p1: 'A', p2: 'B' });
    expect(GRID_21X15_RED_CHAIRS).toEqual([...GRID_21X15_DINING_CHAIR_CELLS]);
    expect(GRID_21X15_DINING_CHAIR_CELLS).toEqual([
      'J5', 'J6', 'J7', 'J8', 'J9', 'K5', 'K9', 'L5', 'L6', 'L7', 'L8', 'L9',
    ]);
    for (const cellId of GRID_21X15_DINING_CHAIR_CELLS) {
      expect(state.board[cellId]!.cellType).toBe('RED_CHAIR');
    }
    const redChairCount = Object.values(state.board).filter((c) => c.cellType === 'RED_CHAIR').length;
    expect(redChairCount).toBe(12);
  });

  it('deals four visible and two hidden secret cards per player in two-player games', () => {
    const state = initializeGame('game-setup-2', ['p1', 'p2'], { p1: 'A', p2: 'B' });
    expect(state.players['p1']!.characterIds).toHaveLength(4);
    expect(state.players['p2']!.characterIds).toHaveLength(4);
    expect(state.players['p1']!.secretCharacterIds).toHaveLength(2);
    expect(state.players['p2']!.secretCharacterIds).toHaveLength(2);
    expect(state.players['p1']!.hasHiddenSecretCard).toBe(true);

    const allDealt = [
      ...state.players['p1']!.characterIds,
      ...state.players['p2']!.characterIds,
      ...state.players['p1']!.secretCharacterIds,
      ...state.players['p2']!.secretCharacterIds,
    ];
    expect(new Set(allDealt).size).toBe(12);
    expect(state.secretCardsRevealed).toBe(false);
  });

  it('uses GRID_21X15 board by default', () => {
    const state = initializeGame('game-setup-grid', ['p1', 'p2'], { p1: 'A', p2: 'B' });
    expect(state.boardVersion).toBe('GRID_21X15');
    expect(Object.keys(state.board)).toHaveLength(315); // 21 * 15 grid
    expect(state.traps.CHANDELIER!.targetCells[0]).toBe('R11');
  });

  it('starts the portrait as Aunt Agatha (doubles may rotate later)', () => {
    const state = initializeGame('game-setup-3', ['p1', 'p2'], { p1: 'A', p2: 'B' });
    const featuredCount = Object.values(state.characters).filter((c) => c.isPortraitHeir).length;
    expect(featuredCount).toBe(0);
    expect(state.activePortrait.currentHeirId).toBe('AUNT_AGATHA');
    expect(state.activePortrait.portraitStack).toHaveLength(12);
    expect(state.activePortrait.lastChangedReason).toBe('OPENING_AGATHA');
  });

  it('starts with a 29-card trap deck and 10-step detective track', () => {
    const state = initializeGame('game-setup-4', ['p1', 'p2'], { p1: 'A', p2: 'B' });
    expect(state.deck).toHaveLength(29);
    expect(buildDeck()).toHaveLength(29);
    expect(state.detectivePosition.maxSteps).toBe(DETECTIVE_TRACK_MAX_STEPS);
  });
});
