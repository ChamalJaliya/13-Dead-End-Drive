/**
 * SoloSession.ts — local authoritative solo play.
 */

import { processTurn } from '@ded/engine/turnOrchestrator.js';
import type { GameState } from '@ded/types/game-state.js';
import type { SocketEvent } from '@ded/types/socket-events.js';
import type { GameSession, StateListener } from './GameSession.js';

export class SoloSession implements GameSession {
  private state: GameState;
  private readonly listeners = new Set<StateListener>();

  public constructor(initial: GameState) {
    this.state = initial;
  }

  public getState(): GameState {
    return this.state;
  }

  public submitAction(event: SocketEvent): GameState {
    this.state = processTurn(this.state, event);
    for (const l of this.listeners) l(this.state);
    return this.state;
  }

  public onState(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public dispose(): void {
    this.listeners.clear();
  }
}
