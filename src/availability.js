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

  // R1 (Practice #10): fail closed on unparseable input, clock or booking rows
  if (
    Number.isNaN(start) || Number.isNaN(end) || Number.isNaN(now) ||
    bookings.some((b) => Number.isNaN(toMs(b.start)) || Number.isNaN(toMs(b.end)))
  ) {
    return { available: false, reason: 'INVALID_INPUT' };
  }

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

/**
 * Multi-room wrapper. Looks the room up by id and applies the same single-room rules.
 * A room's own `blocked` flag is combined with ctx.blocked (either one blocks the room).
 * @param {{start:string,end:string}} request
 * @param {Array<{id:string,blocked?:boolean,bookings:Array<{start:string,end:string}>}>} rooms
 * @param {string} roomId
 * @param {{now:string, blocked?:boolean}} ctx
 * @returns {{available:boolean, reason:string}}
 */
export function checkRoom(request, rooms, roomId, ctx) {
  const room = rooms.find((r) => r.id === roomId);
  if (!room) return { available: false, reason: 'UNKNOWN_ROOM' };
  return checkAvailability(request, room.bookings, {
    ...ctx,
    blocked: Boolean(ctx.blocked || room.blocked),
  });
}

/**
 * Checks the same time slot against every room (used to suggest free rooms).
 * @returns {Array<{id:string, available:boolean, reason:string}>} same order as `rooms`
 */
export function checkAllRooms(request, rooms, ctx) {
  return rooms.map((room) => ({ id: room.id, ...checkRoom(request, rooms, room.id, ctx) }));
}
