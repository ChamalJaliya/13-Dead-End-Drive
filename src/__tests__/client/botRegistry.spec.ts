// botRegistry.spec.ts — createBotPlayers and isBotPlayerId

import { describe, expect, it } from 'vitest';
import {
  createBotPlayerIds,
  createHumanPlayerId,
  isBotPlayerId,
  buildSoloPlayerNames,
} from '../../client/bots/botRegistry.js';

describe('botRegistry', () => {
  it('createBotPlayerIds returns the requested number of bot ids', () => {
    expect(createBotPlayerIds(1)).toHaveLength(1);
    expect(createBotPlayerIds(3)).toHaveLength(3);
    expect(createBotPlayerIds(3)[0]).toBe('player-bot-01');
  });

  it('isBotPlayerId identifies bot seats', () => {
    expect(isBotPlayerId('player-bot-01')).toBe(true);
    expect(isBotPlayerId(createHumanPlayerId())).toBe(false);
  });

  it('buildSoloPlayerNames maps human and bots', () => {
    const human = createHumanPlayerId();
    const bots = createBotPlayerIds(2);
    const names = buildSoloPlayerNames(human, 'Alice', bots);
    expect(names[human]).toBe('Alice');
    expect(names[bots[0]!]).toBe('Bot 1');
    expect(names[bots[1]!]).toBe('Bot 2');
  });
});
