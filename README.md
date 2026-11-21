# Smart Campus - Room Availability Checker (Assignment #04)

A small browser app: pick attendees and required equipment, choose one of the matching fictional rooms, enter a
time range and see whether the room is **Available** or **Unavailable** (with the reason).
Fixed clock `2026-10-27 09:00 UTC`, fictional data only, no backend / login / database.

## Setup, run, test
```bash
npm install          # installs vitest + jsdom (dev only)
npm test             # runs all 82 tests (vitest run)
npx serve .          # then open the printed URL (ES modules do not work from file://)
```
Any static server works, e.g. `python3 -m http.server 8000` and open http://localhost:8000.

## Features
- Catalog of 5 rooms: id, name, capacity, equipment, blocked status, own bookings (`src/fixtures.js`).
- F1 capacity >= attendees - F2 ALL selected equipment - F3 blocked room never available - F4 empty state - F5 room change refreshes result.
- Original rules AC1-AC6 are unchanged: valid range and not in the past, max 120 min, blocked room, overlap (touching endpoints allowed), no mutation of booking data, clear desktop/mobile feedback.

## Structure
| File | Responsibility |
|---|---|
| `src/fixtures.js` | fictional frozen demo data (rooms, bookings, fixed clock) |
| `src/availability.js` | pure booking rules: `checkAvailability`, `checkRoom`, `checkAllRooms` |
| `src/filtering.js` | pure room filters F1, F2 |
| `src/messages.js` | texts and presentation helpers (no DOM) |
| `src/app.js` | UI wiring `mountApp(document)` (testable with jsdom) |
| `src/main.js` | browser entry point |
| `tests/` | 5 test files, 70 tests (see `docs/REPORT.md`) |
| `versions/` | frozen copies: `initial-single-room` (Practice #09 final) and `intermediate-multiroom` (before refactor) |
| `evidence/` | real test outputs and screenshots |

Full analysis, diagrams, quality table and AI-use record: **`docs/REPORT.md`**.

## Practice #10 (risk review)
See `docs/RISK_REVIEW.md` (risk register, agent-readiness audit, release decision) and `evidence/p10/`.
Invalid input is fail-closed (`INVALID_INPUT`); no linter / formatter / type checker / CI exists yet.
