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
  INVALID_INPUT: 'Unavailable: enter a valid start and end time',
});

export const EMPTY_STATE_TEXT = 'No rooms match your requirements';

/** Room label for lists and dropdowns. */
export const describeRoom = (room) => `${room.name} - ${room.capacity} seats`;

/** "HH:MM" from a <input type="time"> -> ISO string on the demo day. */
export const timeToIso = (hhmm) => `${DAY}T${hhmm}:00Z`;

/** Maps a checkAvailability() result to what the page should display. */
export function describeResult(result) {
  return {
    // R2 (Practice #10): unmapped reason -> safe fallback text, never shown as available
    text: MESSAGES[result.reason] ?? 'Unavailable: could not check this request',
    className: result.available && result.reason in MESSAGES ? 'ok' : 'no',
  };
}
