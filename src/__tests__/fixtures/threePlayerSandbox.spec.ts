// threePlayerSandbox.spec.ts — deterministic 3-player GDD sandbox fixture

import { describe, it, expect } from 'vitest';
import {
  makeThreePlayerSandbox,
  threePlayerSandboxManifest,
  SANDBOX_CHARACTER_DEALS,
  SANDBOX_P1,
  SANDBOX_P2,
  SANDBOX_P3,
} from './threePlayerSandbox.fixtures.js';
import { CHARACTER_IDS } from '../../types/enums.js';
import { RED_CHAIR_CELLS } from '../../engine/boardDefinition.js';

describe('makeThreePlayerSandbox', () => {
  it('deals all twelve character identities across three players (4 each)', () => {
    const state = makeThreePlayerSandbox();
    const dealt = [
      ...state.players[SANDBOX_P1]!.characterIds,
      ...state.players[SANDBOX_P2]!.characterIds,
      ...state.players[SANDBOX_P3]!.characterIds,
    ];
    expect(dealt).toHaveLength(12);
    expect(new Set(dealt).size).toBe(12);
    expect([...CHARACTER_IDS].sort()).toEqual([...dealt].sort());
  });

  it('places every pawn on a red chair with pre-assigned trap hands', () => {
    const state = makeThreePlayerSandbox();
    for (const charId of CHARACTER_IDS) {
      const ch = state.characters[charId]!;
      expect(ch.isOnRedChair).toBe(true);
      expect(RED_CHAIR_CELLS).toContain(ch.position);
      expect(ch.controlledBy).not.toBeNull();
    }
    expect(state.players[SANDBOX_P1]!.hand.length).toBe(2);
    expect(state.players[SANDBOX_P2]!.hand.length).toBe(1);
    expect(state.players[SANDBOX_P3]!.hand.length).toBe(1);
  });

  it('exports a stable manifest for agent sandboxes', () => {
    const manifest = threePlayerSandboxManifest();
    expect(manifest.players[SANDBOX_P1]!.characterIds).toEqual([
      ...SANDBOX_CHARACTER_DEALS[SANDBOX_P1]!,
    ]);
    expect(manifest.chairAssignment).toHaveLength(12);
  });
});
