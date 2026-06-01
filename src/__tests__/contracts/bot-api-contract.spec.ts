// bot-api-contract.spec.ts — TS golden fixture for bot-ai
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { BotDecisionRequest } from '../../types/bot-api.js';

describe('BotDecisionRequest contract fixture', () => {
  it('parses golden JSON with required fields', () => {
    const raw = readFileSync(
      resolve(process.cwd(), 'data/fixtures/bot-decision-request.sample.json'),
      'utf8',
    );
    const body = JSON.parse(raw) as BotDecisionRequest;
    expect(body.gameId).toBeTruthy();
    expect(body.botPlayerId).toMatch(/^player-bot-/);
    expect(body.difficulty).toBe('NORMAL');
    expect(body.legalActions.length).toBeGreaterThan(0);
    expect(body.legalActions[0]?.kind).toBe('ROLL_DICE');
  });
});
