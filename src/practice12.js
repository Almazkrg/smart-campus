// Practice #12 (code-based track) - same feature as the low-code app: start time + duration for room A-101.
// Reuses the EXISTING rule engine src/availability.js and the A-101 data in src/fixtures.js (nothing there is changed).
// Three separated parts: validateRequest (validation) -> evaluate (availability calculation) -> UI in practice12-app.js.
import { checkAvailability, MAX_DURATION_MIN } from './availability.js';
import { ROOMS, FIXED_NOW, DAY } from './fixtures.js';

export const ROOM_A101 = ROOMS.find((r) => r.id === 'A-101');

export const P12_MESSAGES = Object.freeze({
  OK: 'Available',
  OVERLAP: 'Unavailable: overlaps an existing booking',
  ROOM_BLOCKED: 'Unavailable: room is blocked',
  INVALID_START: 'Invalid input: enter a valid start time',
  INVALID_DURATION: 'Invalid input: duration must be between 1 and 120 minutes',
  IN_THE_PAST: 'Invalid input: start time must be in the future',
});

const result = (status, reason) => ({ status, reason, message: P12_MESSAGES[reason] });

/** 1) Validation only (start -> duration -> future). */
export function validateRequest({ start, duration }, now = FIXED_NOW) {
  if (typeof start !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(start)) return { ok: false, reason: 'INVALID_START' };
  const d = String(duration ?? '').trim();
  if (!/^\d+$/.test(d) || Number(d) < 1 || Number(d) > MAX_DURATION_MIN) return { ok: false, reason: 'INVALID_DURATION' };
  const startMs = new Date(`${DAY}T${start}:00Z`).getTime();
  if (startMs < new Date(now).getTime()) return { ok: false, reason: 'IN_THE_PAST' };
  return { ok: true, startMs, minutes: Number(d) };
}

/** 2) Calculation + contract { status, reason, message }. Never changes the bookings. */
export function evaluate(input, room = ROOM_A101, now = FIXED_NOW) {
  const v = validateRequest(input, now);
  if (!v.ok) return result('INVALID', v.reason);
  const request = { start: new Date(v.startMs).toISOString(), end: new Date(v.startMs + v.minutes * 60000).toISOString() };
  const decision = checkAvailability(request, room.bookings, { now, blocked: Boolean(room.blocked) || input.roomStatus === 'blocked' });
  return decision.available ? result('AVAILABLE', 'OK') : result('UNAVAILABLE', decision.reason);
}
