/**
 * broadcastPipeline.spec.ts
 * 3 unit tests for secure asymmetric state broadcasts and fault-isolated dissemination.
 *
 * Tests cover:
 *   1. Room diffusion (correctly pushes updates to all connections in a room)
 *   2. Asymmetric shielding (hides competitive players' private states and hands)
 *   3. Error partitioning (socket emission failures do not cascade or halt pipelines)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { filterStateForPlayer, broadcastGameState } from '../../network/broadcastPipeline.js';
import { makeGameState, PLAYER_A_ID, PLAYER_B_ID } from '../fixtures/gameState.fixtures.js';

// Local Mock active table records representing active PostgreSQL storage
let mockConnectionRows: Array<{ socket_id: string; room_id: string; player_id: string }> = [];

// Fluent Mock client wrapper representing Supabase connections
const mockSupabase = {
  from: vi.fn((table: string) => {
    return {
      select: vi.fn((columns?: string) => {
        return {
          eq: vi.fn((field: string, value: any) => {
            if (table === 'player_connections' && field === 'room_id') {
              const matches = mockConnectionRows.filter((r) => r.room_id === value);
              return Promise.resolve({ data: matches, error: null });
            }
            return Promise.resolve({ data: [], error: null });
          }),
        };
      }),
    };
  }),
};

vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: vi.fn(() => mockSupabase),
  };
});

describe('Asymmetric Real-Time Broadcast Pipeline', () => {
  const ROOM_ID = 'game-test-0001';

  beforeEach(() => {
    mockConnectionRows = [];
    vi.restoreAllMocks();
  });

  // ── Assertion 1 (Room Diffusion) ──────────────────────────────────────────

  it('correctly broadcasts state updates to all active connection sockets mapped in room', async () => {
    // Seed connection records in mock database representing two connected players
    mockConnectionRows = [
      { socket_id: 'socket-a', room_id: ROOM_ID, player_id: PLAYER_A_ID },
      { socket_id: 'socket-b', room_id: ROOM_ID, player_id: PLAYER_B_ID },
    ];

    const socketA = { emit: vi.fn() };
    const socketB = { emit: vi.fn() };

    const registry = {
      getClientSocket: vi.fn((id: string) => {
        if (id === 'socket-a') return socketA;
        if (id === 'socket-b') return socketB;
        return undefined;
      }),
    };

    const state = makeGameState({ gameId: ROOM_ID });

    // Execute broad-diffusion pipeline
    await broadcastGameState(mockSupabase as any, registry, ROOM_ID, state);

    // Verify emission dissemination
    expect(socketA.emit).toHaveBeenCalledTimes(1);
    expect(socketA.emit).toHaveBeenCalledWith('STATE_SYNC', expect.any(Object));
    expect(socketB.emit).toHaveBeenCalledTimes(1);
    expect(socketB.emit).toHaveBeenCalledWith('STATE_SYNC', expect.any(Object));
  });

  // ── Assertion 2 (Asymmetric Shielding) ──────────────────────────────────────

  it('masks competitive player private cards and hand values from the recipient client socket', () => {
    const originalState = makeGameState({ gameId: ROOM_ID });

    // Execute asymmetric filtration for Player A
    const filteredForA = filterStateForPlayer(originalState, PLAYER_A_ID);

    // Assert Player A's hidden identity visibility scope is unmasked
    expect(filteredForA.players[PLAYER_A_ID]?.characterIds.length).toBeGreaterThan(0);
    expect(filteredForA.players[PLAYER_A_ID]?.hand.length).toBeGreaterThan(0);

    // Assert competitive Player B's identities and hand records are completely blanked out
    expect(filteredForA.players[PLAYER_B_ID]?.characterIds).toEqual([]);
    expect(filteredForA.players[PLAYER_B_ID]?.hand).toEqual([]);

    // Execute asymmetric filtration for Player B
    const filteredForB = filterStateForPlayer(originalState, PLAYER_B_ID);

    // Assert Player B's hidden identity visibility scope is unmasked
    expect(filteredForB.players[PLAYER_B_ID]?.characterIds.length).toBeGreaterThan(0);
    expect(filteredForB.players[PLAYER_B_ID]?.hand.length).toBeGreaterThan(0);

    // Assert competitive Player A's identities and hand records are completely blanked out
    expect(filteredForB.players[PLAYER_A_ID]?.characterIds).toEqual([]);
    expect(filteredForB.players[PLAYER_A_ID]?.hand).toEqual([]);
  });

  // ── Assertion 3 (Error Partitioning) ────────────────────────────────────────

  it('isolates socket emission exception failures so they do not block parallel player packet streams', async () => {
    mockConnectionRows = [
      { socket_id: 'socket-broken', room_id: ROOM_ID, player_id: PLAYER_A_ID },
      { socket_id: 'socket-healthy', room_id: ROOM_ID, player_id: PLAYER_B_ID },
    ];

    const socketBroken = {
      emit: vi.fn(() => {
        throw new Error('Socket transport connection dropped midway');
      }),
    };
    const socketHealthy = { emit: vi.fn() };

    const registry = {
      getClientSocket: vi.fn((id: string) => {
        if (id === 'socket-broken') return socketBroken;
        if (id === 'socket-healthy') return socketHealthy;
        return undefined;
      }),
    };

    const state = makeGameState({ gameId: ROOM_ID });

    // Suppress console.error log metrics inside test execution output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Execute broad-diffusion pipeline with partial connection failure
    await expect(
      broadcastGameState(mockSupabase as any, registry, ROOM_ID, state),
    ).resolves.not.toThrow();

    // Verify error was logged and partition kept healthy stream active
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Gracefully caught socket socket-broken emission glitch'),
      'Socket transport connection dropped midway',
    );
    expect(socketHealthy.emit).toHaveBeenCalledTimes(1);

    consoleSpy.mockRestore();
  });
});
