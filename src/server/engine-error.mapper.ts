/**
 * engine-error.mapper.ts — map EngineError to wire ErrorResponse.
 */

import { EngineError } from '../engine/EngineError.js';
import type { GameId } from '../types/enums.js';
import type { ErrorResponse } from '../types/socket-events.js';

export function toErrorResponse(
  error: unknown,
  invalidEventId: string,
  gameId: GameId,
): ErrorResponse {
  const base = {
    responseId:         crypto.randomUUID(),
    gameId,
    timestamp:          new Date().toISOString(),
    triggeredByEventId: invalidEventId,
  } as const;

  if (error instanceof EngineError) {
    return {
      type:    'ERROR',
      ...base,
      payload: {
        code:           error.code,
        message:        error.message,
        invalidEventId,
      },
    };
  }
  return {
    type:    'ERROR',
    ...base,
    payload: {
      code:           'MALFORMED_PAYLOAD',
      message:        error instanceof Error ? error.message : 'Unknown error',
      invalidEventId,
    },
  };
}
