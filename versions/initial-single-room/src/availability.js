// Smart Campus - room availability rules (pure: no DOM, no fixtures, no I/O).
export const MAX_DURATION_MIN = 120;

const toMs = (iso) => new Date(iso).getTime();

/**
 * @param {{start:string,end:string}} request  ISO strings
 * @param {Array<{start:string,end:string}>} bookings existing bookings
 * @param {{now:string, blocked?:boolean}} ctx fixed clock + room state
 * @returns {{available:boolean, reason:string}}
 */
export function checkAvailability(request, bookings, ctx) {
  const start = toMs(request.start);
  const end = toMs(request.end);
  const now = toMs(ctx.now);

  // AC1
  if (start >= end) return { available: false, reason: 'INVALID_RANGE' };
  if (start < now) return { available: false, reason: 'IN_THE_PAST' };

  // AC2
  if ((end - start) / 60000 > MAX_DURATION_MIN) {
    return { available: false, reason: 'TOO_LONG' };
  }

  // AC3
  if (ctx.blocked) return { available: false, reason: 'ROOM_BLOCKED' };

  // FIX BUG-B: copy before sorting so the caller's array is never mutated (AC5)
  const sorted = [...bookings].sort((a, b) => toMs(a.start) - toMs(b.start));

  // AC4
  for (const b of sorted) {
    const bs = toMs(b.start);
    const be = toMs(b.end);
    // FIX BUG-A: strict comparison, touching endpoints are allowed (AC4)
    if (start < be && end > bs) {
      return { available: false, reason: 'OVERLAP' };
    }
  }

  return { available: true, reason: 'OK' };
}
