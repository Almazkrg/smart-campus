// Smart Campus - room filtering rules F1, F2 (pure: no DOM, no I/O, never mutates input).

/** Anything that is not a positive number means "no capacity requirement". */
export const normalizeAttendees = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.ceil(n) : 0;
};

/**
 * F1: capacity >= attendees. F2: the room has ALL required equipment items.
 * Blocked rooms are NOT removed here: they still match the requirements, and
 * checkRoom() reports them as unavailable (F3).
 * @param {Array<{capacity:number, equipment:string[]}>} rooms
 * @param {{attendees?:number|string, equipment?:string[]}} requirements
 */
export function filterRooms(rooms, { attendees = 0, equipment = [] } = {}) {
  const needed = normalizeAttendees(attendees);
  return rooms.filter(
    (room) => room.capacity >= needed && equipment.every((item) => room.equipment.includes(item)),
  );
}

/** Sorted list of distinct equipment names in the catalog (for the filter checkboxes). */
export const listEquipment = (rooms) => [...new Set(rooms.flatMap((r) => r.equipment))].sort();
