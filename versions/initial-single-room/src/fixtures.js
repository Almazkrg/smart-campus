// Smart Campus - fictional demo data (one room, fixed clock).
// Kept out of the UI and out of the rule module so the rules stay pure.

export const ROOM_NAME = 'Room A-101';
export const FIXED_NOW = '2026-10-27T09:00:00Z';
export const DAY = '2026-10-27';

const deepFreeze = (value) => {
  Object.values(value).forEach((v) => typeof v === 'object' && v !== null && deepFreeze(v));
  return Object.freeze(value);
};

// Frozen: any accidental mutation (AC5) throws instead of silently changing demo data.
export const BOOKINGS = deepFreeze([
  { start: `${DAY}T10:00:00Z`, end: `${DAY}T11:00:00Z` },
  { start: `${DAY}T13:00:00Z`, end: `${DAY}T14:00:00Z` },
]);
