/**
 * bot-decision.client.ts — HTTP client for services/bot-ai POST /v1/decide.
 */

import { pickHeuristicAction } from '../bots/heuristicFallback.js';
import type { BotDecisionRequest, BotDecisionResponse } from '../types/bot-api.js';

const DEFAULT_TIMEOUT_MS = 8_000;

export class BotDecisionClient {
  public constructor(
    private readonly baseUrl: string = process.env.BOT_AI_URL ?? 'http://localhost:8000',
    private readonly timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ) {}

  public async decide(request: BotDecisionRequest): Promise<BotDecisionResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(`${this.baseUrl}/v1/decide`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(request),
        signal:  controller.signal,
      });
      if (!res.ok) {
        throw new Error(`bot-ai HTTP ${res.status}`);
      }
      return (await res.json()) as BotDecisionResponse;
    } catch {
      const index = pickHeuristicAction(
        request.legalActions,
        request.maskedState,
        request.botPlayerId,
        request.difficulty,
      );
      return {
        actionIndex:  index,
        confidence:   0.5,
        rationale:    'Server heuristic fallback (bot-ai unreachable)',
        strategyUsed: 'HEURISTIC',
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
