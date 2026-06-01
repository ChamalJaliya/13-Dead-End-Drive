// room-persistence.service.spec.ts — in-memory RoomPersistenceService
import { describe, it, expect } from 'vitest';
import { RoomPersistenceService } from '../../server/room-persistence.service.js';
import type { PlayerId } from '../../types/enums.js';

describe('RoomPersistenceService (in-memory)', () => {
  it('creates and finds room by code', async () => {
    const persistence = new RoomPersistenceService();
    const hostId = 'player-host-01' as PlayerId;
    const created = await persistence.createRoom(hostId, 'Host');
    const found = await persistence.findByRoomCode(created.roomCode);
    expect(found?.roomId).toBe(created.roomId);
    expect(found?.state.phase).toBe('LOBBY');
  });

  it('joins a second player in lobby', async () => {
    const persistence = new RoomPersistenceService();
    const hostId = 'player-host-02' as PlayerId;
    const created = await persistence.createRoom(hostId, 'Host');
    const guestId = 'player-guest-01' as PlayerId;
    const next = await persistence.joinRoom(created.roomId, guestId, 'Guest');
    expect(next.turnOrder).toHaveLength(2);
  });
});
