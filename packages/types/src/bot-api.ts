/**
 * bot-api.ts
 * Canonical types for solo-vs-bots AI decision service (TS client ↔ Python FastAPI).
 */

import type { GameState } from './game-state.js';
import type { GameId, PlayerId } from './enums.js';
import type { SocketEvent } from './socket-events.js';

export const BOT_DIFFICULTIES = ['EASY', 'NORMAL', 'HARD'] as const;
export type BotDifficulty = (typeof BOT_DIFFICULTIES)[number];

export const BOT_STRATEGIES = ['HEURISTIC', 'LLM'] as const;
export type BotStrategy = (typeof BOT_STRATEGIES)[number];

export interface BotPlayerConfig {
  readonly playerId: PlayerId;
  readonly displayName: string;
  readonly difficulty: BotDifficulty;
}

/** Serializable event body without idempotency fields (orchestrator adds those). */
export type BotEventTemplate = Omit<SocketEvent, 'eventId' | 'timestamp'>;

export interface BotActionOption {
  readonly optionId: string;
  readonly kind: SocketEvent['type'];
  readonly summary: string;
  readonly event: BotEventTemplate;
}

export interface BotDecisionRequest {
  readonly gameId: GameId;
  readonly botPlayerId: PlayerId;
  readonly difficulty: BotDifficulty;
  readonly strategy: BotStrategy;
  readonly maskedState: GameState;
  readonly legalActions: readonly BotActionOption[];
}

export interface BotDecisionResponse {
  readonly actionIndex: number;
  readonly confidence: number;
  readonly rationale: string;
  readonly strategyUsed: BotStrategy;
}
