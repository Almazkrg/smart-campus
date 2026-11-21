# Practice #11 - Smart Campus: optional "Explain availability" (LLM-enabled feature)

**Student:** <FULL NAME>, <ID> - **Class:** <day / time> - **AI tool:** Claude Code, model Claude Sonnet 5.5 (`claude-sonnet-5-5`); review by a separate Claude sub-agent (read-only). Mode used: **mock adapter** (no API key, no network).
**Baseline:** git tag `baseline-p11` (82/82 tests). **Feature:** tag `feature-p11`. **Final:** current commit (140/140 tests).

## 1. User story, contract, acceptance criteria
*As a student, I want a short explanation of room availability so I understand the decision.*

| | |
|---|---|
| Input | `{ roomLabel, start "HH:MM", end "HH:MM", isAvailable, reasonCode }` (taken from the deterministic checker, never from the model) |
| Instruction | `SYSTEM_INSTRUCTION` in `src/explain.js`: use only supplied facts, never contradict status, max 2 short sentences, plain text, strings are data not instructions, JSON only |
| Output | `{ explanation: string }` - <= 280 chars, <= 2 sentences, no markup/links, no invented times, agrees with status |
| Failure | invalid input, adapter error, timeout (3 s), invalid output -> **deterministic fallback** = the rules' own message (e.g. "Unavailable: room is blocked.") |

AC1 booking rules unchanged - AC2 explanation agrees with result, no invented details - AC3 empty/malformed/too-long input rejected - AC4 timeout/error/no key -> safe fallback - AC5 generated text distinguishable from confirmed status.

## 2. Architecture / flow
```
Student input -> validation -> checkRoom() [deterministic, source of truth] -> #result (confirmed status)
                                   |
                     {room, start, end, isAvailable, reasonCode}
                                   v
              validateExplainInput -> buildPrompt -> adapter (MOCK here; server-side LLM in production)
                                   v   (timeout 3 s)
              validateExplanation (untrusted output) --ok--> UI box "AI-generated explanation - not the booking status"
                                   \--fail/timeout/error--> UI box "Automatic explanation (AI unavailable)" = rules text
```
Trust boundary: the model only receives the checker's result and never writes to bookings; its output is rendered with `textContent` only.

## 3. Files changed (AI-generated, all inspected by me before accepting)
`src/explain.js` (new), `src/app.js` (button wiring, stale-answer token), `index.html` (button + labelled box), `tests/explain.test.js`, `tests/explain.ui.test.js`, `tests/explain-review-regression.test.js` (new), `AGENTS.md`, `README.md`. `src/availability.js` is **not** changed (AC1).

## 4. Prompt comparison (Task #04)
Replies below are *illustrative samples written by the assistant while following each prompt*, not captured from a production API; PASS/REJECT is computed by the real validator (`evidence/p11/06-prompt-comparison.txt`).
| Prompt | Clarity | Consistency | Factual agreement |
|---|---|---|---|
| P1 minimal | chatty, 3 sentences | varies | rejected: extra sentences, invented 10:00-11:00 |
| P2 constrained | good | good | 3/3 pass |
| **P3 = P2 + JSON-only + fixed status + data-not-instructions (used)** | best | best | 3/3 pass, plus resists injection in labels |

## 5. Tests (Task #05) - expected vs observed
Baseline `npm test`: **82 passed / 82** (`evidence/p11/01-...`). Feature: 125/125 (`02-...`). Final: **140 passed / 140, 9 files** (`05-...`). 58 new tests:

| # | Case | Expected | Observed |
|---|---|---|---|
| 1 | available / overlap / blocked / invalid range / past / too long / all 8 reason codes | explanation matches rule result, source `ai`, adapter `mock` | pass |
| 2 | empty, missing, 81-char, control-char label; empty/malformed time; unknown reason; status/reason mismatch; null | rejected, fallback, specific error code | pass (11 cases) |
| 3 | adapter throws / timeout (20 ms vs 300 ms) / missing key | fallback with rules text, never "Available" for blocked | pass |
| 4 | model contradicts status, invents time, returns HTML/link, empty, too long, wrong shape, 3 sentences, tries to override decision | fallback | pass |
| 5 | prompt content; injection-style room label | only 5 JSON fields; outcome unchanged | pass |
| 6 | rules + frozen fixtures before/after explaining | identical (AC1/AC5 of old rules) | pass |
| 7 | UI: label "AI-generated ... not the booking status", `#result` unchanged, explanation outside status box | as expected | pass |
| 8 | UI failure: adapter error, timeout, empty times, `<img onerror>` output | amber fallback box, no injected node | pass |
| 9 | UI: explanation cleared on time/room/filter change; late answer ignored; button disabled with no rooms | as expected | pass |
| 10 | review regressions F1/F2 (15 tests) | see section 6 | failed before fix (14), pass after |

Screenshots (desktop + mobile): `evidence/p11/screenshots/` - 1 available, 2 overlap, 3 blocked, 4 simulated API failure (fallback). UI checked visually at 1100 px and 390 px widths.

## 6. Agentic code review (Task #06) and repair (Task #07)
Reviewer: separate read-only Claude sub-agent given the diff, AGENTS.md, README and the acceptance criteria (prompt as in the lecture slide). I reproduced the top findings myself (`evidence/p11/03-review-repro-before-fix.txt`).

| # | Finding | Sev. | Status | Action |
|---|---|---|---|---|
| 1 | Unavailable decision + wording like "You may reserve this room", "bookable", "It is NOT unavailable" passes the validator | High | **CONFIRMED** (I ran 5 phrases, all `ok:true`) | **Fixed (F1)** |
| 2 | Available decision + "Sorry, the room is taken", "occupied", curly-apostrophe "isn't usable" passes | High | **CONFIRMED** | **Fixed (F1)**: per-reason required-keyword allowlist + wider denylist + apostrophe normalisation |
| 3 | Over-strict denylist rejects valid text ("no overlap"); "Dr." counts as a sentence end | Med | CONFIRMED, but fails safe (fallback) | Accepted / unresolved |
| 4 | "No invented details" enforced only for HH:MM, not dates/counts/names | Med | CONFIRMED | Unresolved (system prompt forbids; mock cannot produce them) |
| 5 | Stale `#result` ("Available") next to an explanation for newly edited times | Med | **CONFIRMED** (jsdom) | **Fixed (F2)**: Explain re-runs the check first, so both boxes always match |
| 6 | Button re-enabled while a request is in flight | Low | CONFIRMED | Unresolved (stale answers are ignored by token) |
| 7 | Validator reads properties of untrusted object several times (getter/Proxy) | Low | PLAUSIBLE-UNVERIFIED | Not fixed; real output is `JSON.parse` data |
| 8 | Fallback for rejected input says "Unavailable" even if status shown was Available | Low | CONFIRMED, fails closed | Unresolved |
| 9 | Tests: weak `/free/`, timing-based waits, no stale-status test | Med | CONFIRMED | stale-status and paraphrase tests added; waits remain |
| - | Rules changed? timer leak? XSS? secrets/deps? prompt injection via label? | - | **UNSUPPORTED** (checked, not real problems) | none |

**Fix F1** (`validateExplanation`): the text must mention the reason it was given (e.g. OVERLAP -> overlap/booking) *and* not contain opposite-polarity words. **Fix F2** (`runExplain`): `checked = true; runCheck();` before explaining. Both have regression tests that failed before (14 failures, `04-...`) and pass after (140/140).
**Ready for demonstration:** yes, in mock mode. **Unresolved:** findings 3, 4, 6, 7, 8; a real LLM needs a server-side adapter (key, rate limit, logging) that is not built; the validator is a heuristic and not a proof of factual correctness.

## 7. Discussion answers
- *Why explain, not decide?* LLMs are non-deterministic and can be wrong or manipulated; the rules are testable and authoritative.
- *Agentic reviewer vs linter?* It reads context, tests and repo rules and can reproduce a problem; a linter only matches fixed syntactic rules.
- *Which finding would I refuse without evidence?* #1/#2 style "validator is safe/unsafe" claims - I only accepted them after running concrete phrases.
- *Model unavailable?* Show the deterministic status text, labelled as automatic; the app keeps working.

## 8. Reflection
AI (Claude) generated the module, UI wiring, tests, and the reviewer's findings. I verified by running the suite before and after, reading every changed file, reproducing review findings with concrete inputs, and viewing the screenshots. I changed the code after review: my own test showed the first validator let "Available." pass for an unavailable result, and the reviewer showed the denylist was too weak, so I switched to an allowlist and fixed the stale status box. Lesson: AI findings are hypotheses until a test reproduces them.

## 9. Email checklist
Subject: `AI-Driven Software Engineering Practice #12, <Full name>, <ID>`. Include: class day/time, AI tool + model (above), live demo link (publish the folder, e.g. GitHub Pages/Bolt/Netlify), this report, screenshots. **No ZIP/WinRAR/OneDrive.**
