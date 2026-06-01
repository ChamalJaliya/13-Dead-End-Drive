/**
 * botRegistry.ts — player IDs and labels for solo-vs-bots matches.
 */

import type { BotDifficulty } from '../../types/bot-api.js';
import type { PlayerId } from '../../types/enums.js';

export type OpponentCount = 1 | 2 | 3;

const BOT_ID_PREFIX = 'player-bot-';

export function createHumanPlayerId(): PlayerId {
  return `player-human-${crypto.randomUUID()}` as PlayerId;
}

export function createBotPlayerIds(count: OpponentCount): readonly PlayerId[] {
  const ids: PlayerId[] = [];
  for (let i = 1; i <= count; i++) {
    ids.push(`${BOT_ID_PREFIX}${String(i).padStart(2, '0')}` as PlayerId);
  }
  return ids;
}

export function botDisplayName(index: number): string {
  return `Bot ${index}`;
}

export function isBotPlayerId(playerId: PlayerId): boolean {
  return playerId.startsWith(BOT_ID_PREFIX);
}

export function buildSoloPlayerNames(
  humanId: PlayerId,
  humanName: string,
  botIds: readonly PlayerId[],
): Record<PlayerId, string> {
  const names: Record<PlayerId, string> = {
    [humanId]: humanName.trim() || 'You',
  };
  botIds.forEach((id, idx) => {
    names[id] = botDisplayName(idx + 1);
  });
  return names;
}

export const DEFAULT_BOT_DIFFICULTY: BotDifficulty = 'NORMAL';
