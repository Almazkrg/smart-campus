// @vitest-environment jsdom
// Practice #10 - regression tests for CONFIRMED risks R1 and R2 (see docs/RISK_REVIEW.md).
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { checkAvailability, checkRoom, checkAllRooms } from '../src/availability.js';
import { mountApp } from '../src/app.js';
import { ROOMS, FIXED_NOW } from '../src/fixtures.js';
import { MESSAGES, describeResult, timeToIso } from '../src/messages.js';

const t = (hhmm) => `2026-10-27T${hhmm}:00Z`;
const ctx = { now: FIXED_NOW };
const bookings = () => [{ start: t('10:00'), end: t('11:00') }];

describe('R1 invalid input must fail closed (never "Available")', () => {
  it('empty time inputs', () => {
    expect(checkAvailability({ start: timeToIso(''), end: timeToIso('') }, bookings(), ctx))
      .toEqual({ available: false, reason: 'INVALID_INPUT' });
  });
  it('one empty time input', () => {
    expect(checkAvailability({ start: timeToIso(''), end: t('10:30') }, bookings(), ctx).available).toBe(false);
    expect(checkAvailability({ start: t('10:30'), end: timeToIso('') }, bookings(), ctx).available).toBe(false);
  });
  it('garbage strings', () => {
    expect(checkAvailability({ start: 'x', end: 'y' }, bookings(), ctx).reason).toBe('INVALID_INPUT');
  });
  it('missing clock', () => {
    expect(checkAvailability({ start: t('11:00'), end: t('12:00') }, bookings(), {}).reason).toBe('INVALID_INPUT');
  });
  it('malformed booking row is not silently ignored', () => {
    expect(checkAvailability({ start: t('11:00'), end: t('12:00') }, [{ start: 'bad', end: 'bad' }], ctx).reason).toBe('INVALID_INPUT');
  });
  it('no room is reported available for empty input (multi-room)', () => {
    const all = checkAllRooms({ start: timeToIso(''), end: timeToIso('') }, ROOMS, ctx);
    expect(all.every((r) => r.available === false)).toBe(true);
  });
  it('valid requests are unaffected', () => {
    expect(checkRoom({ start: t('11:00'), end: t('12:00') }, ROOMS, 'A-101', ctx)).toEqual({ available: true, reason: 'OK' });
  });
});

describe('R2 every reason must have visible text (no blank/undefined result)', () => {
  it('has messages for the new and existing reasons', () => {
    ['OK', 'INVALID_RANGE', 'IN_THE_PAST', 'TOO_LONG', 'ROOM_BLOCKED', 'OVERLAP', 'UNKNOWN_ROOM', 'INVALID_INPUT']
      .forEach((r) => expect(typeof MESSAGES[r]).toBe('string'));
  });
  it('unmapped reason falls back to a safe unavailable message', () => {
    expect(describeResult({ available: false, reason: 'SOMETHING_NEW' }))
      .toEqual({ text: 'Unavailable: could not check this request', className: 'no' });
  });
  it('an unmapped reason is never shown as available', () => {
    expect(describeResult({ available: true, reason: 'SOMETHING_NEW' }).className).toBe('no');
  });
  it('known results are unchanged', () => {
    expect(describeResult({ available: true, reason: 'OK' })).toEqual({ text: 'Available', className: 'ok' });
  });
});

describe('R1 in the real page (jsdom)', () => {
  const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
  const body = html.match(/<body>([\s\S]*)<\/body>/)[1].replace(/<script[\s\S]*?<\/script>/g, '');
  beforeEach(() => { document.body.innerHTML = body; mountApp(document); });
  it('cleared time fields show an error, not "Available"', () => {
    document.getElementById('s').value = '';
    document.getElementById('e').value = '';
    document.getElementById('go').click();
    expect(document.getElementById('result').textContent).toBe('Unavailable: enter a valid start and end time');
    expect(document.getElementById('result').className).toBe('no');
    expect([...document.querySelectorAll('#all li')].every((li) => li.className === 'no')).toBe(true);
  });
});
