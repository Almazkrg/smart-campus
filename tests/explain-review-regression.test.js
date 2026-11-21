// @vitest-environment jsdom
// Practice #11 - regression tests for the two CONFIRMED review findings (see docs/PRACTICE11.md).
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateExplanation } from '../src/explain.js';
import { mountApp } from '../src/app.js';

const no = { roomLabel: 'Room A-101', start: '10:30', end: '11:30', isAvailable: false, reasonCode: 'OVERLAP' };
const yes = { ...no, isAvailable: true, reasonCode: 'OK' };

describe('F1 (review #1/#2) status agreement must be an allowlist, not only a word denylist', () => {
  it.each([
    'You may reserve this room for that slot.',
    'The room is vacant, go ahead and reserve it.',
    'No conflicts were found, so it is yours.',
    'Room A-101 is unoccupied at 10:30-11:30.',
    'It is NOT unavailable.',
    'The slot is bookable.',
  ])('rejects for an unavailable decision: %s', (text) => {
    expect(validateExplanation({ explanation: text }, no).ok).toBe(false);
  });
  it.each([
    'Sorry, the room is taken.',
    'The room is occupied.',
    'There is a conflict with another reservation.',
    'The room isn’t usable.',
    'Not free at that time.',
    'It is closed.',
  ])('rejects for an available decision: %s', (text) => {
    expect(validateExplanation({ explanation: text }, yes).ok).toBe(false);
  });
  it('still accepts the normal, correct explanations', () => {
    expect(validateExplanation({ explanation: 'Room A-101 already has a booking that overlaps 10:30-11:30. Please try a different time or room.' }, no).ok).toBe(true);
    expect(validateExplanation({ explanation: 'Room A-101 is free from 10:30 to 11:30, so this time slot can be used.' }, yes).ok).toBe(true);
  });
});

describe('F2 (review #5) the explanation always matches the status shown in the page', () => {
  const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
  const bodyMarkup = html.match(/<body>([\s\S]*)<\/body>/)[1].replace(/<script[\s\S]*?<\/script>/g, '');
  const $ = (id) => document.getElementById(id);
  beforeEach(() => { document.body.innerHTML = bodyMarkup; mountApp(document); });
  const edit = (id, v) => { $(id).value = v; $(id).dispatchEvent(new Event('input', { bubbles: true })); };

  it('changing the times after a check and pressing Explain refreshes the status too', async () => {
    edit('s', '11:00'); edit('e', '12:00'); $('go').click();
    expect($('result').textContent).toBe('Available');
    edit('s', '10:30'); edit('e', '11:30'); // no re-check by the user
    $('explain').click();
    await new Promise((r) => setTimeout(r, 30));
    expect($('result').textContent).toBe('Unavailable: overlaps an existing booking');
    expect($('explanation').textContent).toContain('overlaps 10:30-11:30');
  });
  it('Explain without a prior Check also shows the confirmed status', async () => {
    $('explain').click();
    await new Promise((r) => setTimeout(r, 30));
    expect($('result').textContent).toBe('Available');
    expect($('explanation').textContent).toMatch(/free/);
  });
});
