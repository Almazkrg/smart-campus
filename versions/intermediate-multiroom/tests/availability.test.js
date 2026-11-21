import { describe, it, expect } from 'vitest';
import { checkAvailability, MAX_DURATION_MIN } from '../src/availability.js';

// Fixed clock: no dependence on real time
const NOW = '2026-10-27T09:00:00Z';
const ctx = (extra = {}) => ({ now: NOW, ...extra });
const t = (hhmm) => `2026-10-27T${hhmm}:00Z`;
// Fresh fixture for every test
const fixture = () => [
  { start: t('10:00'), end: t('11:00') },
  { start: t('13:00'), end: t('14:00') },
];

describe('AC1 invalid ranges and past', () => {
  it('T01 rejects start == end', () => {
    expect(checkAvailability({ start: t('12:00'), end: t('12:00') }, fixture(), ctx()))
      .toEqual({ available: false, reason: 'INVALID_RANGE' });
  });
  it('T02 rejects start > end', () => {
    expect(checkAvailability({ start: t('12:30'), end: t('12:00') }, fixture(), ctx()).available).toBe(false);
  });
  it('T03 rejects requests in the past', () => {
    expect(checkAvailability({ start: t('08:00'), end: t('08:30') }, fixture(), ctx()))
      .toEqual({ available: false, reason: 'IN_THE_PAST' });
  });
});

describe('AC2 maximum duration', () => {
  it('T04 allows exactly 120 minutes', () => {
    expect(MAX_DURATION_MIN).toBe(120);
    expect(checkAvailability({ start: t('15:00'), end: t('17:00') }, fixture(), ctx()).available).toBe(true);
  });
  it('T05 rejects 121 minutes', () => {
    expect(checkAvailability({ start: t('15:00'), end: '2026-10-27T17:01:00Z' }, fixture(), ctx()))
      .toEqual({ available: false, reason: 'TOO_LONG' });
  });
});

describe('AC3 blocked room', () => {
  it('T06 rejects when room is blocked', () => {
    expect(checkAvailability({ start: t('15:00'), end: t('16:00') }, fixture(), ctx({ blocked: true })))
      .toEqual({ available: false, reason: 'ROOM_BLOCKED' });
  });
});

describe('AC4 overlap rules', () => {
  it('T07 rejects a real overlap', () => {
    expect(checkAvailability({ start: t('10:30'), end: t('11:30') }, fixture(), ctx()))
      .toEqual({ available: false, reason: 'OVERLAP' });
  });
  it('T08 rejects a request fully inside a booking', () => {
    expect(checkAvailability({ start: t('10:15'), end: t('10:45') }, fixture(), ctx()).available).toBe(false);
  });
  it('T09 allows request that ends exactly when a booking starts (BUG-A)', () => {
    expect(checkAvailability({ start: t('09:30'), end: t('10:00') }, fixture(), ctx()))
      .toEqual({ available: true, reason: 'OK' });
  });
  it('T10 allows request that starts exactly when a booking ends (BUG-A)', () => {
    expect(checkAvailability({ start: t('11:00'), end: t('12:00') }, fixture(), ctx()))
      .toEqual({ available: true, reason: 'OK' });
  });
  it('T11 allows a free slot between bookings', () => {
    expect(checkAvailability({ start: t('11:30'), end: t('12:30') }, fixture(), ctx()).available).toBe(true);
  });
});

describe('AC5 no mutation of booking data', () => {
  it('T12 does not reorder or change the bookings array (BUG-B)', () => {
    const unsorted = [
      { start: t('13:00'), end: t('14:00') },
      { start: t('10:00'), end: t('11:00') },
    ];
    const snapshot = JSON.parse(JSON.stringify(unsorted));
    checkAvailability({ start: t('15:00'), end: t('16:00') }, unsorted, ctx());
    expect(unsorted).toEqual(snapshot);
  });
});
