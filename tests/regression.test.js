import { describe, it, expect } from 'vitest';
import { checkAvailability } from '../src/availability.js';
import { BOOKINGS, FIXED_NOW, ROOM_NAME } from '../src/fixtures.js';
import { MESSAGES, describeResult, timeToIso } from '../src/messages.js';

// Regression tests added for Practice #09 (module-boundary refactoring).
// Existing tests in availability.test.js are untouched.
const t = timeToIso;
const ctx = (extra = {}) => ({ now: FIXED_NOW, ...extra });
const check = (s, e, extra) => checkAvailability({ start: t(s), end: t(e) }, BOOKINGS, ctx(extra));

describe('R1 AC1: reversed interval and past time (through the shared fixtures)', () => {
  it('rejects reversed interval 12:00-11:00', () => {
    expect(check('12:00', '11:00')).toEqual({ available: false, reason: 'INVALID_RANGE' });
  });
  it('rejects a request that starts before the fixed clock (08:59)', () => {
    expect(check('08:59', '09:30')).toEqual({ available: false, reason: 'IN_THE_PAST' });
  });
  it('allows a request that starts exactly at the fixed clock (09:00)', () => {
    expect(check('09:00', '10:00')).toEqual({ available: true, reason: 'OK' });
  });
});

describe('R2 AC2: duration limit', () => {
  it('rejects 121 minutes', () => {
    expect(checkAvailability({ start: t('15:00'), end: '2026-10-27T17:01:00Z' }, BOOKINGS, ctx()))
      .toEqual({ available: false, reason: 'TOO_LONG' });
  });
  it('allows exactly 120 minutes', () => {
    expect(check('15:00', '17:00')).toEqual({ available: true, reason: 'OK' });
  });
});

describe('R3 AC3: blocked room', () => {
  it('rejects a free slot when the room is blocked', () => {
    expect(check('15:00', '16:00', { blocked: true })).toEqual({ available: false, reason: 'ROOM_BLOCKED' });
  });
});

describe('R4 AC4: overlap and endpoints', () => {
  it('rejects overlap with the first booking', () => {
    expect(check('10:30', '11:30')).toEqual({ available: false, reason: 'OVERLAP' });
  });
  it('rejects overlap with the second booking', () => {
    expect(check('12:30', '13:30')).toEqual({ available: false, reason: 'OVERLAP' });
  });
  it('rejects a request that fully contains a booking', () => {
    expect(check('09:30', '11:30')).toEqual({ available: false, reason: 'OVERLAP' });
  });
  it('allows touching at the end of a booking (11:00-12:00)', () => {
    expect(check('11:00', '12:00')).toEqual({ available: true, reason: 'OK' });
  });
  it('allows touching at the start of a booking (09:30-10:00)', () => {
    expect(check('09:30', '10:00')).toEqual({ available: true, reason: 'OK' });
  });
  it('allows the gap squeezed between two bookings (11:00-13:00)', () => {
    expect(check('11:00', '13:00')).toEqual({ available: true, reason: 'OK' });
  });
});

describe('R5 AC5: fixtures are never mutated', () => {
  it('leaves the shared fixture deep-equal and frozen after many different checks', () => {
    const snapshot = JSON.parse(JSON.stringify(BOOKINGS));
    [['09:30', '10:00'], ['10:30', '11:30'], ['11:00', '12:00'], ['15:00', '16:00']]
      .forEach(([s, e]) => check(s, e));
    expect(BOOKINGS).toEqual(snapshot);
    expect(Object.isFrozen(BOOKINGS)).toBe(true);
    expect(Object.isFrozen(BOOKINGS[0])).toBe(true);
  });
  it('does not reorder an unsorted caller array (frozen -> would throw if sorted in place)', () => {
    const unsorted = Object.freeze([
      Object.freeze({ start: t('13:00'), end: t('14:00') }),
      Object.freeze({ start: t('10:00'), end: t('11:00') }),
    ]);
    expect(() => checkAvailability({ start: t('15:00'), end: t('16:00') }, unsorted, ctx())).not.toThrow();
    expect(unsorted[0].start).toBe(t('13:00'));
  });
  it('gives the same answer when called twice (no hidden state)', () => {
    expect(check('10:30', '11:30')).toEqual(check('10:30', '11:30'));
  });
});

describe('R6 AC6: clear feedback (presentation helpers)', () => {
  it('has a human-readable message for every reason the rules can return', () => {
    ['OK', 'INVALID_RANGE', 'IN_THE_PAST', 'TOO_LONG', 'ROOM_BLOCKED', 'OVERLAP'].forEach((reason) => {
      expect(typeof MESSAGES[reason]).toBe('string');
      expect(MESSAGES[reason].length).toBeGreaterThan(0);
    });
  });
  it('marks an available result as ok and an unavailable one as no', () => {
    expect(describeResult({ available: true, reason: 'OK' })).toEqual({ text: 'Available', className: 'ok' });
    expect(describeResult({ available: false, reason: 'OVERLAP' }))
      .toEqual({ text: 'Unavailable: overlaps an existing booking', className: 'no' });
  });
  it('turns <input type=time> values into ISO strings on the demo day', () => {
    expect(timeToIso('11:00')).toBe('2026-10-27T11:00:00Z');
  });
  it('keeps the demo fixtures identical to the Practice #08 UI (room, clock, two bookings)', () => {
    expect(ROOM_NAME).toBe('Room A-101');
    expect(FIXED_NOW).toBe('2026-10-27T09:00:00Z');
    expect(BOOKINGS).toEqual([
      { start: '2026-10-27T10:00:00Z', end: '2026-10-27T11:00:00Z' },
      { start: '2026-10-27T13:00:00Z', end: '2026-10-27T14:00:00Z' },
    ]);
  });
});
