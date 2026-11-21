# AGENTS.md

## Project
Smart Campus room availability checker for **multiple rooms** (A-101, A-102, B-201, C-301). Each room has its own
fictional bookings and a `blocked` flag; fixed clock (2026-10-27 09:00 UTC). The app only returns availability decisions.

## Structure
- `src/availability.js` - pure booking rules: `checkAvailability` (one room's bookings), `checkRoom` (lookup by room id), `checkAllRooms`. No DOM, no fixtures.
- `src/fixtures.js` - fictional demo data (`ROOMS` list, fixed clock, frozen bookings). `ROOM_NAME`/`BOOKINGS` still point to the first room.
- `src/messages.js` - reason -> message/CSS class, time -> ISO helper (no DOM).
- `src/main.js` - UI wiring only (reads inputs, calls the rules, shows the result).
- `index.html` - page markup and styles.
- `tests/` - Vitest tests (`availability.test.js` original, `regression.test.js` added in Practice #09, `multiroom.test.js` added after teacher feedback).

## Constraints
- Must support many rooms; never hardcode a single room in rules or UI.
- Preserve AC1-AC6 for every room:
  - AC1 reject start >= end and requests in the past
  - AC2 reject durations over 120 minutes (exactly 120 is allowed)
  - AC3 reject a blocked room (per-room `blocked` flag or `ctx.blocked`)
  - AC4 reject overlaps; bookings touching only at endpoints are allowed
  - AC5 never mutate booking data
  - AC6 keep clear feedback on desktop and mobile widths
- No backend, login, database or saved booking creation.
- Keep the existing UI look and message texts; new rooms are added to `ROOMS` only (do not edit A-101 values).

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
