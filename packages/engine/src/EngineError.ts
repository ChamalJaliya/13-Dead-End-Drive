/**
 * EngineError.ts
 * Typed error class used by every engine function.
 * Carries a SocketErrorCode so the WS layer can map it directly to an ErrorResponse.
 */

import type { SocketErrorCode } from '@ded/types/enums.js';

export class EngineError extends Error {
  public readonly code: SocketErrorCode;

  constructor(code: SocketErrorCode, message: string) {
    super(message);
    this.name = 'EngineError';
    this.code = code;

    // Restore prototype chain in environments that transpile classes
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
