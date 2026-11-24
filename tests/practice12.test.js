// @vitest-environment jsdom
// Practice #12: the 8 identical test cases (T1-T8) for the code-based solution - logic AND real page.
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { evaluate, ROOM_A101 } from '../src/practice12.js';
import { mountPractice12 } from '../src/practice12-app.js';

const MSG = {
  ok: 'Available',
  overlap: 'Unavailable: overlaps an existing booking',
  blocked: 'Unavailable: room is blocked',
  duration: 'Invalid input: duration must be between 1 and 120 minutes',
  past: 'Invalid input: start time must be in the future',
};
const CASES = [
  ['T1 valid free interval', '15:00', '60', 'available', 'AVAILABLE', 'OK', MSG.ok],
  ['T2 overlap with an existing booking', '10:30', '60', 'available', 'UNAVAILABLE', 'OVERLAP', MSG.overlap],
  ['T3 blocked room', '15:00', '60', 'blocked', 'UNAVAILABLE', 'ROOM_BLOCKED', MSG.blocked],
  ['T4 duration = 0', '15:00', '0', 'available', 'INVALID', 'INVALID_DURATION', MSG.duration],
  ['T5 duration = 121 minutes', '15:00', '121', 'available', 'INVALID', 'INVALID_DURATION', MSG.duration],
  ['T6 past start time', '08:00', '30', 'available', 'INVALID', 'IN_THE_PAST', MSG.past],
  ['T7 adjacent non-overlapping interval', '11:00', '60', 'available', 'AVAILABLE', 'OK', MSG.ok],
];

describe('Practice #12 logic: T1-T7', () => {
  it.each(CASES)('%s', (_n, start, duration, roomStatus, status, reason, message) => {
    expect(evaluate({ start, duration, roomStatus })).toEqual({ status, reason, message });
  });
  it('T8 booking data unchanged after all checks', () => {
    const before = JSON.stringify(ROOM_A101.bookings);
    CASES.forEach(([, start, duration, roomStatus]) => evaluate({ start, duration, roomStatus }));
    expect(JSON.stringify(ROOM_A101.bookings)).toBe(before);
    expect(Object.isFrozen(ROOM_A101.bookings)).toBe(true);
  });
  it('edge cases: 120 allowed; empty/text/decimal duration and bad start rejected', () => {
    expect(evaluate({ start: '15:00', duration: '120', roomStatus: 'available' }).status).toBe('AVAILABLE');
    for (const duration of ['', 'abc', '-5', '1.5']) expect(evaluate({ start: '15:00', duration }).reason).toBe('INVALID_DURATION');
    for (const start of ['', '25:00', undefined, '<img src=x onerror=alert(1)>']) expect(evaluate({ start, duration: '60' }).reason).toBe('INVALID_START');
  });
});

describe('Practice #12 real page (practice12.html): visible message', () => {
  const html = readFileSync(resolve(process.cwd(), 'practice12.html'), 'utf8');
  const body = html.match(/<body>([\s\S]*)<\/body>/)[1].replace(/<script[\s\S]*?<\/script>/g, '');
  const $ = (id) => document.getElementById(id);
  beforeEach(() => { document.body.innerHTML = body; mountPractice12(document); });
  it.each(CASES)('%s', (_n, start, duration, roomStatus, _s, reason, message) => {
    $('start').value = start; $('duration').value = duration; $('status').value = roomStatus; $('go').click();
    expect($('result').textContent).toBe(message);
    expect($('result').dataset.reason).toBe(reason);
    expect($('result').querySelector('*')).toBeNull();
  });
  it('T8 bookings list on the page is unchanged', () => {
    const before = $('bookings').textContent;
    CASES.forEach(([, start, duration, roomStatus]) => { $('start').value = start; $('duration').value = duration; $('status').value = roomStatus; $('go').click(); });
    expect($('bookings').textContent).toBe(before);
  });
});
