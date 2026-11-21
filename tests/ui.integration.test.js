// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mountApp } from '../src/app.js';
import { ROOMS } from '../src/fixtures.js';
import { EMPTY_STATE_TEXT } from '../src/messages.js';

// Integration / UI behaviour: the REAL index.html markup + the REAL app.js wiring + real rules.
const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
const bodyMarkup = html.match(/<body>([\s\S]*)<\/body>/)[1].replace(/<script[\s\S]*?<\/script>/g, '');

const $ = (id) => document.getElementById(id);
const fire = (el, type) => el.dispatchEvent(new Event(type, { bubbles: true }));
const setValue = (id, value, type = 'input') => { $(id).value = value; fire($(id), type); };
const pickRoom = (id) => setValue('room', id, 'change');
const tick = (item) => { const box = document.querySelector(`#equipment input[value="${item}"]`); box.checked = true; fire(box, 'change'); };
const check = (start, end) => { $('s').value = start; $('e').value = end; $('go').click(); };
const roomIds = () => [...$('room').options].map((o) => o.value);

beforeEach(() => {
  document.body.innerHTML = bodyMarkup;
  mountApp(document);
});

describe('U1 initial page', () => {
  it('lists every room and one equipment checkbox per catalog item', () => {
    expect(roomIds()).toEqual(ROOMS.map((r) => r.id));
    expect(document.querySelectorAll('#equipment input')).toHaveLength(5);
  });
});

describe('U2 availability uses the CHOSEN room bookings (not another room)', () => {
  it('10:30-11:30 is unavailable in A-101 but available in A-102', () => {
    pickRoom('A-101'); check('10:30', '11:30');
    expect($('result').textContent).toBe('Unavailable: overlaps an existing booking');
    expect($('result').className).toBe('no');
    pickRoom('A-102');
    expect($('result').textContent).toBe('Available');
    expect($('result').className).toBe('ok');
  });
});

describe('U3 F5 room switching refreshes the result and the booking list', () => {
  it('re-checks the new room automatically after a check was made', () => {
    pickRoom('A-102'); check('14:30', '15:30');
    expect($('result').textContent).toBe('Unavailable: overlaps an existing booking');
    pickRoom('A-101');
    expect($('result').textContent).toBe('Available');
    expect($('bookings').textContent).toContain('10:00 - 11:00');
  });
  it('shows no stale result when the room changes before any check', () => {
    pickRoom('A-102');
    expect($('result').textContent).toBe('');
  });
});

describe('U4 F1/F2 filters change the visible rooms', () => {
  it('capacity filter hides small rooms', () => {
    setValue('n', '100');
    expect(roomIds()).toEqual(['B-201']);
  });
  it('equipment filter requires all ticked items', () => {
    tick('projector'); tick('whiteboard');
    expect(roomIds()).toEqual(['A-101', 'B-201']);
  });
  it('keeps the selected room when it still matches, else falls back to the first match', () => {
    pickRoom('B-201'); setValue('n', '10');
    expect($('room').value).toBe('B-201');
    setValue('n', '121');
    expect(roomIds()).toEqual([]);
  });
});

describe('U5 F4 empty state', () => {
  it('shows a clear message, disables the check and hides results when nothing matches', () => {
    check('11:00', '12:00');
    setValue('n', '500');
    expect($('empty').hidden).toBe(false);
    expect($('empty').textContent).toBe(EMPTY_STATE_TEXT);
    expect($('go').disabled).toBe(true);
    expect($('room').disabled).toBe(true);
    expect($('result').textContent).toBe('');
    expect($('all').children).toHaveLength(0);
    setValue('n', '');
    expect($('empty').hidden).toBe(true);
    expect($('go').disabled).toBe(false);
  });
});

describe('U6 F3 blocked room in the UI', () => {
  it('reports the blocked lab as unavailable and never as available', () => {
    tick('computers');
    expect(roomIds()).toEqual(['C-301']);
    check('15:00', '16:00');
    expect($('result').textContent).toBe('Unavailable: room is blocked');
  });
});

describe('U7 matching-rooms list only contains filtered rooms', () => {
  it('lists just the rooms that passed the filters', () => {
    setValue('n', '25'); check('15:00', '16:00');
    const rows = [...$('all').children].map((li) => li.textContent);
    expect(rows).toEqual(['Room A-101: Available', 'Lecture Hall B-201: Available']); // capacity >= 25
    expect(rows.join('|')).not.toContain('A-102');
    expect(rows.join('|')).not.toContain('C-301');
  });
});

describe('U8 AC1-AC4 still apply through the UI', () => {
  it('rejects reversed, past and too-long ranges and allows touching endpoints', () => {
    check('12:00', '11:00'); expect($('result').textContent).toBe('Unavailable: start must be before end');
    check('08:00', '08:30'); expect($('result').textContent).toBe('Unavailable: time is in the past');
    check('15:00', '17:01'); expect($('result').textContent).toBe('Unavailable: max 120 minutes');
    check('11:00', '12:00'); expect($('result').textContent).toBe('Available');
  });
});
