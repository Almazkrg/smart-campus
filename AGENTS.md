# AGENTS.md

## Project
Smart Campus room availability checker for a **catalog of 5 fictional rooms**. Each room has an id, name, `capacity`,
`equipment` list, `blocked` flag and its own bookings; users can filter rooms by attendees and required equipment; fixed clock (2026-10-27 09:00 UTC). The app only returns availability decisions.

## Structure
- `src/availability.js` - pure booking rules: `checkAvailability` (one room's bookings), `checkRoom` (lookup by room id), `checkAllRooms`. No DOM, no fixtures.
- `src/filtering.js` - pure room filters: F1 capacity >= attendees, F2 ALL required equipment, `listEquipment`.
- `src/app.js` - UI wiring (`mountApp(document)`); `src/main.js` only calls it.
- `src/fixtures.js` - fictional demo data (`ROOMS` list, fixed clock, frozen bookings). `ROOM_NAME`/`BOOKINGS` still point to the first room.
- `src/messages.js` - reason -> message/CSS class, time -> ISO helper (no DOM).
- `index.html` - page markup and styles.
- `tests/` - Vitest tests (`availability.test.js` original, `regression.test.js` added in Practice #09, `multiroom.test.js` and `filtering.test.js` for Assignment #04, `ui.integration.test.js` runs the real page in jsdom, `risk-regression.test.js` added in Practice #10). Risk register: `docs/RISK_REVIEW.md`.

## Constraints
- Filtering rules: F1 capacity >= attendees; F2 room must have ALL selected equipment; F3 blocked room is never available;
  F4 clear empty state when no room matches; F5 changing the room refreshes the result.
- Must support many rooms; never hardcode a single room in rules or UI.
- Preserve AC1-AC6 for every room:
  - AC1 reject start >= end and requests in the past
  - AC2 reject durations over 120 minutes (exactly 120 is allowed)
  - AC3 reject a blocked room (per-room `blocked` flag or `ctx.blocked`)
  - AC4 reject overlaps; bookings touching only at endpoints are allowed
  - AC5 never mutate booking data
  - AC6 keep clear feedback on desktop and mobile widths
- No backend, login, database or saved booking creation.
- Fail closed: invalid input, unknown room or unmapped reason must never be shown as "Available".
- No real personal data, secrets or `.env` files.
- Keep the existing UI look and message texts; new rooms are added to `ROOMS` only (do not edit A-101 values).

## Engineering rules
- Prefer pure functions and minimal changes; use at most 2 justified patterns.
- No Singleton, Factory or class hierarchies without a concrete need.
- Adapter only if fixtures really have two shapes; Strategy only if two real policies exist.
- Never weaken or delete existing test assertions.
- Do not refactor code that is unrelated to the task.

## Commands
- Install: `npm install`
- Test: `npm test` (runs `vitest run`)
- Preview: serve the folder over HTTP (ES modules do not work from `file://`), e.g. `npx serve .`

## Forbidden actions
- No deploy/publish, no push to `main`, no force-push, no `git reset --hard`.
- No new dependencies, no network calls from app code, no hand-editing `node_modules` or the lockfile.
- Work on a separate branch/worktree; never edit files outside this repository.

## Review gates
1. Run `npm test` before proposing a change; report real passed/failed counts.
2. Show the diff and list changed files; a human approves before merge or publish.
3. Never claim a test or build passed unless it was actually executed.

## Verification
Run the tests, add focused regression tests for any changed rule, and report changed files,
rationale and the real test output (passed/failed counts).
