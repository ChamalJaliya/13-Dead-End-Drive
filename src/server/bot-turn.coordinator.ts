/**
 * bot-turn.coordinator.ts — server-side bot turn: legal actions → bot-ai → SocketEvent.
 */

import { enumerateLegalActions } from '@ded/game-logic/legalActions.js';
import { filterStateForPlayer } from '@ded/network/broadcastPipeline.js';
import type { GameState } from '../types/game-state.js';
import type { SocketEvent } from '../types/socket-events.js';
import type { PlayerId } from '../types/enums.js';
import type { BotDifficulty, BotStrategy } from '../types/bot-api.js';
import { BotDecisionClient } from './bot-decision.client.js';
import { buildSocketEvent } from '@ded/game-logic/buildBotEvent.js';

export class BotTurnCoordinator {
  public constructor(private readonly client: BotDecisionClient = new BotDecisionClient()) {}

  public async buildBotAction(
    state: GameState,
    botPlayerId: PlayerId,
    difficulty: BotDifficulty = 'NORMAL',
    strategy: BotStrategy = 'HEURISTIC',
  ): Promise<SocketEvent | null> {
    const legal = enumerateLegalActions(state, botPlayerId);
    if (legal.length === 0) return null;

    const maskedState = filterStateForPlayer(state, botPlayerId);
    const response = await this.client.decide({
      gameId:       state.gameId,
      botPlayerId,
      difficulty,
      strategy,
      maskedState,
      legalActions: legal,
    });

    const index = response.actionIndex;
    if (index < 0 || index >= legal.length) return null;
    const option = legal[index];
    if (!option) return null;

    return buildSocketEvent(option.event, state.gameId, botPlayerId);
  }
}
