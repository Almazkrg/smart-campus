// Smart Campus - fictional demo data (several rooms, fixed clock).
// Kept out of the UI and out of the rule module so the rules stay pure.

export const FIXED_NOW = '2026-10-27T09:00:00Z';
export const DAY = '2026-10-27';

const deepFreeze = (value) => {
  Object.values(value).forEach((v) => typeof v === 'object' && v !== null && deepFreeze(v));
  return Object.freeze(value);
};

const at = (hhmm) => `${DAY}T${hhmm}:00Z`;

// Frozen: any accidental mutation (AC5) throws instead of silently changing demo data.
export const ROOMS = deepFreeze([
  {
    id: 'A-101',
    name: 'Room A-101',
    capacity: 30,
    equipment: ['projector', 'whiteboard'],
    blocked: false,
    bookings: [
      { start: at('10:00'), end: at('11:00') },
      { start: at('13:00'), end: at('14:00') },
    ],
  },
  {
    id: 'A-102',
    name: 'Room A-102',
    capacity: 20,
    equipment: ['whiteboard'],
    blocked: false,
    bookings: [
      { start: at('09:00'), end: at('10:30') },
      { start: at('14:00'), end: at('16:00') },
    ],
  },
  {
    id: 'B-201',
    name: 'Lecture Hall B-201',
    capacity: 120,
    equipment: ['microphone', 'projector', 'whiteboard'],
    blocked: false,
    bookings: [],
  },
  {
    id: 'C-301',
    name: 'Lab C-301 (maintenance)',
    capacity: 24,
    equipment: ['computers', 'projector'],
    blocked: true,
    bookings: [{ start: at('12:00'), end: at('13:00') }],
  },
  {
    id: 'D-401',
    name: 'Meeting Room D-401',
    capacity: 8,
    equipment: ['video-conference', 'whiteboard'],
    blocked: false,
    bookings: [{ start: at('11:00'), end: at('12:00') }],
  },
]);

// Backward compatible exports: the first room is still the original Practice #08/#09 room.
export const ROOM_NAME = ROOMS[0].name;
export const BOOKINGS = ROOMS[0].bookings;
