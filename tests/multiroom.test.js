import { describe, it, expect } from 'vitest';
import { checkRoom, checkAllRooms } from '../src/availability.js';
import { ROOMS, FIXED_NOW } from '../src/fixtures.js';
import { MESSAGES, timeToIso } from '../src/messages.js';

// Multi-room tests added after teacher feedback: the checker must work for many rooms.
const t = timeToIso;
const ctx = (extra = {}) => ({ now: FIXED_NOW, ...extra });
const req = (s, e) => ({ start: t(s), end: t(e) });

describe('M1 fixtures contain several independent rooms', () => {
  it('has at least 3 rooms with unique ids', () => {
    expect(ROOMS.length).toBeGreaterThanOrEqual(3);
    expect(new Set(ROOMS.map((r) => r.id)).size).toBe(ROOMS.length);
  });
});

describe('M2 each room uses its own bookings', () => {
  it('11:00-12:00 is free in A-101 and in A-102', () => {
    expect(checkRoom(req('11:00', '12:00'), ROOMS, 'A-101', ctx())).toEqual({ available: true, reason: 'OK' });
    expect(checkRoom(req('11:00', '12:00'), ROOMS, 'A-102', ctx())).toEqual({ available: true, reason: 'OK' });
  });
  it('10:30-11:30 overlaps A-101 but is free in A-102', () => {
    expect(checkRoom(req('10:30', '11:30'), ROOMS, 'A-101', ctx()).reason).toBe('OVERLAP');
    expect(checkRoom(req('10:30', '11:30'), ROOMS, 'A-102', ctx()).available).toBe(true);
  });
  it('14:30-15:30 overlaps A-102 but is free in A-101', () => {
    expect(checkRoom(req('14:30', '15:30'), ROOMS, 'A-102', ctx()).reason).toBe('OVERLAP');
    expect(checkRoom(req('14:30', '15:30'), ROOMS, 'A-101', ctx()).available).toBe(true);
  });
  it('a room without bookings is always free for a valid request', () => {
    expect(checkRoom(req('10:00', '11:00'), ROOMS, 'B-201', ctx())).toEqual({ available: true, reason: 'OK' });
  });
  it('keeps touching endpoints allowed per room (A-102 ends 10:30)', () => {
    expect(checkRoom(req('10:30', '11:30'), ROOMS, 'A-102', ctx()).available).toBe(true);
  });
});

describe('M3 blocked room is a per-room property', () => {
  it('rejects every valid request for the blocked lab', () => {
    expect(checkRoom(req('15:00', '16:00'), ROOMS, 'C-301', ctx())).toEqual({ available: false, reason: 'ROOM_BLOCKED' });
  });
  it('does not block the other rooms', () => {
    expect(checkRoom(req('15:00', '16:00'), ROOMS, 'B-201', ctx()).available).toBe(true);
  });
  it('ctx.blocked still blocks any room', () => {
    expect(checkRoom(req('15:00', '16:00'), ROOMS, 'B-201', ctx({ blocked: true })).reason).toBe('ROOM_BLOCKED');
  });
});

describe('M4 shared rules apply to every room', () => {
  ROOMS.forEach((room) => {
    it(`${room.id}: rejects reversed, past and too-long requests`, () => {
      expect(checkRoom(req('12:00', '11:00'), ROOMS, room.id, ctx()).reason).toBe('INVALID_RANGE');
      expect(checkRoom(req('08:00', '08:30'), ROOMS, room.id, ctx()).reason).toBe('IN_THE_PAST');
      expect(checkRoom({ start: t('15:00'), end: '2026-10-27T17:01:00Z' }, ROOMS, room.id, ctx()).reason).toBe('TOO_LONG');
    });
  });
});

describe('M5 unknown room', () => {
  it('returns UNKNOWN_ROOM with a message instead of throwing', () => {
    const result = checkRoom(req('15:00', '16:00'), ROOMS, 'Z-999', ctx());
    expect(result).toEqual({ available: false, reason: 'UNKNOWN_ROOM' });
    expect(typeof MESSAGES.UNKNOWN_ROOM).toBe('string');
  });
});

describe('M6 checkAllRooms', () => {
  it('returns one result per room in order', () => {
    const all = checkAllRooms(req('10:30', '11:30'), ROOMS, ctx());
    expect(all.map((r) => r.id)).toEqual(ROOMS.map((r) => r.id));
    expect(all.find((r) => r.id === 'A-101').available).toBe(false);
    expect(all.find((r) => r.id === 'A-102').available).toBe(true);
    expect(all.find((r) => r.id === 'B-201').available).toBe(true);
    expect(all.find((r) => r.id === 'C-301').reason).toBe('ROOM_BLOCKED');
  });
});

describe('M7 AC5: multi-room data is never mutated', () => {
  it('keeps ROOMS deep-equal and frozen after many checks', () => {
    const snapshot = JSON.parse(JSON.stringify(ROOMS));
    checkAllRooms(req('10:30', '11:30'), ROOMS, ctx());
    checkAllRooms(req('15:00', '16:00'), ROOMS, ctx());
    expect(ROOMS).toEqual(snapshot);
    expect(Object.isFrozen(ROOMS)).toBe(true);
    expect(Object.isFrozen(ROOMS[0])).toBe(true);
    expect(Object.isFrozen(ROOMS[0].bookings[0])).toBe(true);
  });
});
