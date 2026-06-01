/**
 * RuleModule.ts — plug-in contract for RFC 007 optional rules.
 */

import type { GameState } from '@ded/types/game-state.js';
import type { RuleModuleId } from '@ded/types/rule-profile.js';
import type { PlayerId } from '@ded/types/enums.js';
import type { SocketEvent } from '@ded/types/socket-events.js';
import type { BotActionOption } from '@ded/types/bot-api.js';

export interface RuleModule {
  readonly id: RuleModuleId;
  readonly displayName: string;
  readonly description: string;
  readonly guardMove?: (state: GameState, event: SocketEvent) => void;
  readonly afterMove?: (state: GameState) => GameState;
  readonly extendLegalActions?: (
    state: GameState,
    playerId: PlayerId,
    actions: readonly BotActionOption[],
  ) => readonly BotActionOption[];
}
