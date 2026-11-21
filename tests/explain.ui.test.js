// @vitest-environment jsdom
// Practice #11 - UI tests: the explanation is optional, labelled, and never changes the decision (AC1, AC4, AC5).
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mountApp } from '../src/app.js';
import { createMockAdapter } from '../src/explain.js';

const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
const bodyMarkup = html.match(/<body>([\s\S]*)<\/body>/)[1].replace(/<script[\s\S]*?<\/script>/g, '');
const $ = (id) => document.getElementById(id);
const fire = (el, type) => el.dispatchEvent(new Event(type, { bubbles: true }));
const setValue = (id, value, type = 'input') => { $(id).value = value; fire($(id), type); };
const mount = (opts) => { document.body.innerHTML = bodyMarkup; mountApp(document, undefined, opts); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const explain = async () => { $('explain').click(); await wait(30); };

beforeEach(() => mount());

describe('U1 explanation box is separate and labelled (AC5)', () => {
  it('shows an AI label and keeps the confirmed booking status text untouched', async () => {
    setValue('room', 'A-101', 'change'); setValue('s', '10:30'); setValue('e', '11:30');
    $('go').click();
    const status = $('result').textContent;
    await explain();
    expect(status).toBe('Unavailable: overlaps an existing booking');
    expect($('result').textContent).toBe(status); // unchanged by the explanation
    expect($('result').className).toBe('no');
    expect($('explanation').textContent).toContain('AI-generated explanation (mock mode) - not the booking status');
    expect($('explanation').textContent).toContain('overlaps 10:30-11:30');
    expect($('explanation').contains($('result'))).toBe(false);
  });
  it('explains an available slot with positive wording', async () => {
    setValue('s', '11:00'); setValue('e', '12:00'); $('go').click();
    await explain();
    expect($('result').textContent).toBe('Available');
    expect($('explanation').textContent).toMatch(/is free from 11:00 to 12:00/);
  });
  it('explains the blocked room without calling it available', async () => {
    setValue('room', 'C-301', 'change'); setValue('s', '15:00'); setValue('e', '16:00'); $('go').click();
    await explain();
    expect($('result').textContent).toBe('Unavailable: room is blocked');
    expect($('explanation').textContent).toMatch(/blocked/);
    expect($('explanation').textContent).not.toMatch(/is free|is available/);
  });
});

describe('U2 failure paths show a safe fallback (AC4)', () => {
  it('adapter failure -> labelled fallback with the rules message, booking status intact', async () => {
    mount({ explainAdapter: createMockAdapter({ fail: true }) });
    setValue('s', '10:30'); setValue('e', '11:30'); $('go').click();
    await explain();
    expect($('explanation').className).toBe('fallback');
    expect($('explanation').textContent).toContain('Automatic explanation (AI unavailable)');
    expect($('explanation').textContent).toContain('Unavailable: overlaps an existing booking.');
    expect($('result').textContent).toBe('Unavailable: overlaps an existing booking');
  });
  it('timeout -> fallback and the button is usable again', async () => {
    mount({ explainAdapter: createMockAdapter({ delayMs: 200 }), explainTimeoutMs: 20 });
    $('explain').click();
    await wait(60);
    expect($('explanation').className).toBe('fallback');
    expect($('explain').disabled).toBe(false);
  });
  it('empty time input -> rejected, never shown as available', async () => {
    setValue('s', ''); setValue('e', '');
    await explain();
    expect($('explanation').textContent).toContain('Unavailable: enter a valid start and end time.');
    expect($('explanation').textContent).not.toMatch(/is free|Available\./);
  });
  it('model output with HTML is rendered as text only (no injected nodes)', async () => {
    mount({ explainAdapter: createMockAdapter({ override: () => ({ explanation: '<img src=x onerror=alert(1)>' }) }) });
    await explain();
    expect($('explanation').querySelector('img')).toBeNull();
    expect($('explanation').className).toBe('fallback');
  });
});

describe('U3 explanation never goes stale', () => {
  it('is cleared when the time, room or filters change', async () => {
    await explain();
    expect($('explanation').textContent).not.toBe('');
    setValue('e', '13:00');
    expect($('explanation').textContent).toBe('');
    await explain(); setValue('room', 'A-102', 'change');
    expect($('explanation').textContent).toBe('');
    await explain(); setValue('n', '100');
    expect($('explanation').textContent).toBe('');
  });
  it('a late answer for old inputs is ignored', async () => {
    mount({ explainAdapter: createMockAdapter({ delayMs: 40 }) });
    $('explain').click();
    setValue('e', '12:30'); // inputs change while the "model" is thinking
    await wait(100);
    expect($('explanation').textContent).toBe('');
  });
  it('button is disabled when no room matches the filters', () => {
    setValue('n', '9999');
    expect($('explain').disabled).toBe(true);
  });
});
