/**
 * LocalSession.ts — hot-seat local multiplayer via LocalMultiplayerClient.
 */

import type { LocalMultiplayerClient } from '../multiplayer/localMultiplayerClient.js';
import type { GameState } from '@ded/types/game-state.js';
import type { SocketEvent } from '@ded/types/socket-events.js';
import type { GameSession, StateListener } from './GameSession.js';

export class LocalSession implements GameSession {
  private readonly listeners = new Set<StateListener>();

  public constructor(
    private readonly client: LocalMultiplayerClient,
    private state: GameState,
  ) {}

  public getState(): GameState {
    return this.state;
  }

  public submitAction(event: SocketEvent): GameState {
    const next = this.client.submitAction(event);
    this.state = next;
    for (const l of this.listeners) l(next);
    return next;
  }

  public onState(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public dispose(): void {
    this.listeners.clear();
  }

  public updateState(state: GameState): void {
    this.state = state;
  }
}
