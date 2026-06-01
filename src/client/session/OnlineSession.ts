/**
 * OnlineSession.ts — server-authoritative; never calls processTurn.
 */

import type { ColyseusRemoteClient } from '../multiplayer/colyseusRemoteClient.js';
import type { GameState } from '@ded/types/game-state.js';
import type { SocketEvent } from '@ded/types/socket-events.js';
import type { GameSession, StateListener } from './GameSession.js';

export class OnlineSession implements GameSession {
  private state: GameState | null = null;
  private readonly listeners = new Set<StateListener>();

  public constructor(private readonly client: ColyseusRemoteClient) {}

  public getState(): GameState | null {
    return this.state;
  }

  public submitAction(event: SocketEvent): null {
    this.client.submitAction(event);
    return null;
  }

  public onState(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public applyServerState(state: GameState): void {
    this.state = state;
    for (const l of this.listeners) l(state);
  }

  public dispose(): void {
    this.listeners.clear();
    this.state = null;
  }
}
