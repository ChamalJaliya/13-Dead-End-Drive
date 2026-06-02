/**
 * sessionManager.spec.ts
 * Rebuilt integration tests for the WebSocket session manager.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionManager } from '../../network/sessionManager.js';
import { makeGameState, makeDiceRoll, PLAYER_A_ID, PLAYER_B_ID } from '../fixtures/gameState.fixtures.js';

let mockRooms = new Map<string, any>();
let mockConnections = new Map<string, any>();

const mockSupabaseClient = {
  from: vi.fn((table: string) => {
    return {
      insert: vi.fn((payload: any) => {
        if (table === 'game_rooms') {
          const records = Array.isArray(payload) ? payload : [payload];
          for (const rec of records) {
            mockRooms.set(rec.id, {
              id:         rec.id,
              room_code:  rec.room_code,
              status:     rec.status,
              game_state: rec.game_state,
              updated_at: new Date().toISOString(),
            });
          }
        } else if (table === 'player_connections') {
          const records = Array.isArray(payload) ? payload : [payload];
          for (const rec of records) {
            mockConnections.set(rec.socket_id, {
              socket_id: rec.socket_id,
              room_id:   rec.room_id,
              player_id: rec.player_id,
            });
          }
        }
        return Promise.resolve({ data: payload, error: null });
      }),
      upsert: vi.fn((payload: any) => {
        if (table === 'player_connections') {
          const records = Array.isArray(payload) ? payload : [payload];
          for (const rec of records) {
            mockConnections.set(rec.socket_id, {
              socket_id: rec.socket_id,
              room_id:   rec.room_id,
              player_id: rec.player_id,
            });
          }
        }
        return Promise.resolve({ data: payload, error: null });
      }),
      select: vi.fn(() => {
        return {
          eq: vi.fn((field: string, value: any) => {
            return {
              single: vi.fn(() => {
                if (table === 'game_rooms') {
                  const room = mockRooms.get(value);
                  if (!room) {
                    return Promise.resolve({ data: null, error: { message: 'Room not found' } });
                  }
                  return Promise.resolve({ data: room, error: null });
                } else if (table === 'player_connections') {
                  if (field === 'socket_id') {
                    const conn = mockConnections.get(value);
                    if (!conn) {
                      return Promise.resolve({ data: null, error: { message: 'Connection not found' } });
                    }
                    return Promise.resolve({ data: conn, error: null });
                  }
                }
                return Promise.resolve({ data: null, error: { message: 'Not found' } });
              }),
            };
          }),
        };
      }),
      update: vi.fn((payload: any) => {
        return {
          eq: vi.fn((field: string, value: any) => {
            if (table === 'game_rooms') {
              const room = mockRooms.get(value);
              if (room) {
                mockRooms.set(value, {
                  ...room,
                  ...payload,
                  updated_at: new Date().toISOString(),
                });
              }
            }
            return Promise.resolve({ error: null });
          }),
        };
      }),
      delete: vi.fn(() => {
        return {
          eq: vi.fn((field: string, value: any) => {
            if (table === 'player_connections') {
              if (field === 'socket_id') {
                mockConnections.delete(value);
              }
            }
            return Promise.resolve({ error: null });
          }),
        };
      }),
    };
  }),
};

vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: vi.fn(() => mockSupabaseClient),
  };
});

describe('WebSocket Session Manager & Room Lifecycle', () => {
  let manager: SessionManager;

  beforeEach(() => {
    mockRooms.clear();
    mockConnections.clear();
    manager = new SessionManager();
  });

  describe('CREATE_ROOM Lifecycle', () => {
    it('creates a unique room and initializes lobby', async () => {
      const state = await manager.createRoom('evt-create-001', PLAYER_A_ID, '2026-05-23T04:00:00Z');

      expect(state.gameId).toBeDefined();
      expect(state.phase).toBe('LOBBY');
      expect(state.activePlayerId).toBe(PLAYER_A_ID);
    });
  });

  describe('Engine Execution Pipeline Integration', () => {
    it('intercepts MOVE_PAWN, processes turn, saves and returns updated state', async () => {
      const socketId = 'socket-client-a1';
      
      const initialGameState = {
        ...makeGameState(),
        phase:          'IN_PROGRESS' as const,
        subPhase:       'FIRST_MOVE' as const,
        activePlayerId: PLAYER_A_ID,
        lastDiceRoll:   makeDiceRoll(1, 2, PLAYER_A_ID),
        pipsRemaining:  1 as const,
      };
      
      const roomId = initialGameState.gameId;

      await manager.setRoomState(roomId, initialGameState);
      await manager.registerSocket(socketId, roomId, PLAYER_A_ID);

      const moveEvent: any = {
        type:      'MOVE_PAWN',
        eventId:   'evt-test-pawn-move-001',
        gameId:    roomId,
        playerId:  PLAYER_A_ID,
        timestamp: '2026-05-23T04:08:00Z',
        payload: {
          characterId: 'SMOTHERS',
          fromCell:    'RC_1',
          toCell:      'HALL_1',
          pipsUsed:    1,
          path:        ['RC_1', 'HALL_1'],
        },
      };

      const finalState = await manager.handlePlayerAction(socketId, moveEvent);

      expect(finalState.subPhase).toBe('SECOND_MOVE');
      expect(finalState.characters['SMOTHERS']?.position).toBe('HALL_1');

      const savedState = await manager.getRoomState(roomId);
      expect(savedState).toEqual(finalState);
    });
  });
});
