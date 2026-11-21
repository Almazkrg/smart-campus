import { describe, it, expect } from 'vitest';
import { filterRooms, listEquipment, normalizeAttendees } from '../src/filtering.js';
import { checkRoom } from '../src/availability.js';
import { ROOMS, FIXED_NOW } from '../src/fixtures.js';
import { timeToIso } from '../src/messages.js';

const ids = (rooms) => rooms.map((r) => r.id);
const t = timeToIso;

describe('catalog (Assignment #04 data requirements)', () => {
  it('has at least 4 rooms, each with id, name, capacity, equipment, blocked and bookings', () => {
    expect(ROOMS.length).toBeGreaterThanOrEqual(4);
    ROOMS.forEach((r) => {
      expect(typeof r.id).toBe('string');
      expect(typeof r.name).toBe('string');
      expect(Number.isInteger(r.capacity) && r.capacity > 0).toBe(true);
      expect(Array.isArray(r.equipment)).toBe(true);
      expect(typeof r.blocked).toBe('boolean');
      expect(Array.isArray(r.bookings)).toBe(true);
    });
  });
});

describe('F1 capacity filter (capacity >= attendees)', () => {
  it('keeps a room whose capacity equals attendees exactly (boundary)', () => {
    expect(ids(filterRooms(ROOMS, { attendees: 30 }))).toContain('A-101');
  });
  it('drops a room with insufficient capacity (31 > 30)', () => {
    const result = ids(filterRooms(ROOMS, { attendees: 31 }));
    expect(result).not.toContain('A-101');
    expect(result).toContain('B-201');
  });
  it('treats empty, zero, negative or invalid attendees as "no requirement"', () => {
    ['', 0, -5, 'abc', undefined].forEach((v) => {
      expect(filterRooms(ROOMS, { attendees: v })).toHaveLength(ROOMS.length);
    });
    expect(normalizeAttendees('12.2')).toBe(13);
  });
});

describe('F2 equipment filter (ALL selected items)', () => {
  it('requires every selected item, not just one', () => {
    expect(ids(filterRooms(ROOMS, { equipment: ['projector', 'whiteboard'] }))).toEqual(['A-101', 'B-201']);
  });
  it('returns only rooms that have a single selected item', () => {
    expect(ids(filterRooms(ROOMS, { equipment: ['video-conference'] }))).toEqual(['D-401']);
  });
  it('combines capacity and equipment', () => {
    expect(ids(filterRooms(ROOMS, { attendees: 100, equipment: ['microphone'] }))).toEqual(['B-201']);
  });
  it('lists the distinct equipment of the catalog, sorted', () => {
    expect(listEquipment(ROOMS)).toEqual(['computers', 'microphone', 'projector', 'video-conference', 'whiteboard']);
  });
});

describe('F3 blocked room is never reported as available', () => {
  it('a blocked room matches the filter but checkRoom rejects it', () => {
    expect(ids(filterRooms(ROOMS, { equipment: ['computers'] }))).toEqual(['C-301']);
    expect(checkRoom({ start: t('15:00'), end: t('16:00') }, ROOMS, 'C-301', { now: FIXED_NOW }))
      .toEqual({ available: false, reason: 'ROOM_BLOCKED' });
  });
});

describe('F4 no matching rooms', () => {
  it('returns an empty array (the UI shows the empty state)', () => {
    expect(filterRooms(ROOMS, { attendees: 500 })).toEqual([]);
    expect(filterRooms(ROOMS, { equipment: ['projector', 'video-conference'] })).toEqual([]);
  });
});

describe('AC5 filtering never mutates the catalog', () => {
  it('leaves ROOMS deep-equal after filtering', () => {
    const snapshot = JSON.parse(JSON.stringify(ROOMS));
    filterRooms(ROOMS, { attendees: 10, equipment: ['whiteboard'] });
    expect(ROOMS).toEqual(snapshot);
  });
});
