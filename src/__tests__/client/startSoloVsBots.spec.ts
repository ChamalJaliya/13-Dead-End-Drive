// startSoloVsBots.spec.ts — solo vs bots game initialization

import { describe, expect, it, beforeEach } from 'vitest';
import { useGameStore } from '../../client/store/useGameStore.js';
import { useUiStore } from '../../client/store/useUiStore.js';
import { isBotPlayerId } from '../../client/bots/botRegistry.js';

describe('startSoloVsBots', () => {
  beforeEach(() => {
    useUiStore.getState().resetUi();
    useGameStore.setState({
      gameState: null,
      botPlayerIds: [],
      playMode: 'solo',
      gameSession: null,
    });
  });

  it('creates human plus bot players for opponent count', () => {
    useGameStore.getState().startSoloVsBots('Alice', 2, 'NORMAL');
    const { gameState, botPlayerIds, localPlayerId } = useGameStore.getState();
    expect(gameState).not.toBeNull();
    expect(botPlayerIds).toHaveLength(2);
    expect(gameState!.turnOrder).toHaveLength(3);
    expect(isBotPlayerId(gameState!.turnOrder[1]!)).toBe(true);
    expect(localPlayerId).toBe(gameState!.turnOrder[0]);
    expect(gameState!.players[localPlayerId]?.displayName).toBe('Alice');
  });
});
