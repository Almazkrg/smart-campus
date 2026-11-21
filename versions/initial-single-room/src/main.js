// Smart Campus - UI wiring only. Business rules live in availability.js.
import { checkAvailability } from './availability.js';
import { BOOKINGS, FIXED_NOW } from './fixtures.js';
import { describeResult, timeToIso } from './messages.js';

const $ = (id) => document.getElementById(id);

$('go').onclick = () => {
  const request = { start: timeToIso($('s').value), end: timeToIso($('e').value) };
  const result = checkAvailability(request, BOOKINGS, {
    now: FIXED_NOW,
    blocked: $('b').checked,
  });
  const view = describeResult(result);
  const el = $('result');
  el.textContent = view.text;
  el.className = view.className;
};
