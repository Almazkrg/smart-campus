// Smart Campus - presentation helpers (no DOM access, so they are unit-testable).
import { DAY } from './fixtures.js';

export const MESSAGES = Object.freeze({
  OK: 'Available',
  INVALID_RANGE: 'Unavailable: start must be before end',
  IN_THE_PAST: 'Unavailable: time is in the past',
  TOO_LONG: 'Unavailable: max 120 minutes',
  ROOM_BLOCKED: 'Unavailable: room is blocked',
  OVERLAP: 'Unavailable: overlaps an existing booking',
  UNKNOWN_ROOM: 'Unavailable: unknown room',
});

/** "HH:MM" from a <input type="time"> -> ISO string on the demo day. */
export const timeToIso = (hhmm) => `${DAY}T${hhmm}:00Z`;

/** Maps a checkAvailability() result to what the page should display. */
export function describeResult(result) {
  return {
    text: MESSAGES[result.reason],
    className: result.available ? 'ok' : 'no',
  };
}
