// botOrchestrator.spec.ts — BotOrchestrator scheduling

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BotOrchestrator } from '../../client/bots/BotOrchestrator.js';
import { initializeGame, repairGridChairSpawns } from '../../engine/gameInitializer.js';
import {
  createBotPlayerIds,
  createHumanPlayerId,
  buildSoloPlayerNames,
} from '../../client/bots/botRegistry.js';

describe('BotOrchestrator', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
  });

  it('does nothing when active player is human', async () => {
    const humanId = createHumanPlayerId();
    const botIds = createBotPlayerIds(1);
    const names = buildSoloPlayerNames(humanId, 'You', botIds);
    const gs = repairGridChairSpawns(
      initializeGame('g1', [humanId, botIds[0]!], names),
    );

    const syncServerState = vi.fn();
    const orchestrator = new BotOrchestrator();

    await orchestrator.scheduleTurnCheck(() => ({
      gameState: gs,
      playMode: 'solo',
      botPlayerIds: botIds,
      botDifficulty: 'NORMAL',
      syncServerState,
      submitBotAction: vi.fn(),
      addLog: vi.fn(),
      setBotThinking: vi.fn(),
    }));

    expect(syncServerState).not.toHaveBeenCalled();
  });
});
