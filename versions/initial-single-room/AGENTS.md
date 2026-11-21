# AGENTS.md

## Project
Smart Campus room availability checker (Room A-101). One room, fictional bookings, fixed clock
(2026-10-27 09:00 UTC). The app only returns an availability decision.

## Structure
- `src/availability.js` - pure booking rules (`checkAvailability`). No DOM, no fixtures.
- `src/fixtures.js` - fictional demo data (room, fixed clock, frozen bookings).
- `src/messages.js` - reason -> message/CSS class, time -> ISO helper (no DOM).
- `src/main.js` - UI wiring only (reads inputs, calls the rules, shows the result).
- `index.html` - page markup and styles.
- `tests/` - Vitest tests (`availability.test.js` original, `regression.test.js` added in Practice #09).

## Constraints
- Preserve AC1-AC6:
  - AC1 reject start >= end and requests in the past
  - AC2 reject durations over 120 minutes (exactly 120 is allowed)
  - AC3 reject a blocked room
  - AC4 reject overlaps; bookings touching only at endpoints are allowed
  - AC5 never mutate booking data
  - AC6 keep clear feedback on desktop and mobile widths
- No backend, login, database or saved booking creation.
- Do not change the existing UI look, texts or fixture values.

## Engineering rules
- Prefer pure functions and minimal changes; use at most 2 justified patterns.
- No Singleton, Factory or class hierarchies without a concrete need.
- Adapter only if fixtures really have two shapes; Strategy only if two real policies exist.
- Never weaken or delete existing test assertions.

## Commands
- Install: `npm install`
- Test: `npm test` (runs `vitest run`)
- Preview: serve the folder over HTTP (ES modules do not work from `file://`), e.g. `npx serve .`

## Verification
Run the tests, add focused regression tests for any changed rule, and report changed files,
rationale and the real test output (passed/failed counts).
