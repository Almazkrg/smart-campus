// Task #04: compare three prompts. The "model" replies below are ILLUSTRATIVE SAMPLES written by the
// assistant (Claude) while following each prompt; they were NOT captured from a production API.
// Each reply is run through the real validateExplanation(); the pass/fail column is computed, not typed.
import { validateExplanation } from '../../src/explain.js';

const scen = {
  available: { roomLabel: 'Room A-101', start: '11:00', end: '12:00', isAvailable: true, reasonCode: 'OK' },
  overlap: { roomLabel: 'Room A-101', start: '10:30', end: '11:30', isAvailable: false, reasonCode: 'OVERLAP' },
  blocked: { roomLabel: 'Lab C-301 (maintenance)', start: '15:00', end: '16:00', isAvailable: false, reasonCode: 'ROOM_BLOCKED' },
};
const prompts = {
  'P1 minimal ("Explain this room result")': {
    available: 'Great news! Room A-101 is free from 11:00 to 12:00. It is usually quiet at that hour, and the projector works. Enjoy your class!',
    overlap: 'Room A-101 is booked by another group between 10:00 and 11:00, so you cannot use it then.',
    blocked: 'Lab C-301 is blocked right now because of maintenance work.',
  },
  'P2 constrained (facts only, max 2 sentences)': {
    available: 'Room A-101 is free from 11:00 to 12:00, so this time slot can be used.',
    overlap: 'Room A-101 already has a booking that overlaps 10:30-11:30.',
    blocked: 'Lab C-301 (maintenance) is currently blocked, so it cannot be requested.',
  },
  'P3 constrained + JSON-only + status fixed + data-not-instructions (SYSTEM_INSTRUCTION in src/explain.js)': {
    available: 'Room A-101 is free from 11:00 to 12:00, so this time slot can be used.',
    overlap: 'Room A-101 already has a booking that overlaps 10:30-11:30. Please try a different time or room.',
    blocked: 'Lab C-301 (maintenance) is currently blocked, so it cannot be requested at any time.',
  },
};
for (const [name, replies] of Object.entries(prompts)) {
  console.log(`\n${name}`);
  for (const [k, text] of Object.entries(replies)) {
    const r = validateExplanation({ explanation: text }, scen[k]);
    console.log(`  ${k.padEnd(9)} ${r.ok ? 'PASS' : 'REJECT (' + r.error + ')'}  | ${text}`);
  }
}
