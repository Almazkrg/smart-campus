// Smart Campus - UI wiring only. Business rules live in availability.js.
import { checkRoom, checkAllRooms } from './availability.js';
import { ROOMS, FIXED_NOW } from './fixtures.js';
import { describeResult, timeToIso } from './messages.js';

const $ = (id) => document.getElementById(id);

const fmt = (iso) => iso.slice(11, 16);

function renderBookings(roomId) {
  const room = ROOMS.find((r) => r.id === roomId);
  const list = $('bookings');
  list.replaceChildren();
  if (!room || room.bookings.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No bookings';
    list.append(li);
    return;
  }
  room.bookings.forEach((b) => {
    const li = document.createElement('li');
    li.textContent = `${fmt(b.start)} - ${fmt(b.end)}`;
    list.append(li);
  });
}

function init() {
  const select = $('room');
  ROOMS.forEach((r) => {
    const opt = document.createElement('option');
    opt.value = r.id;
    opt.textContent = r.name;
    select.append(opt);
  });
  select.onchange = () => renderBookings(select.value);
  renderBookings(select.value);
}

$('go').onclick = () => {
  const request = { start: timeToIso($('s').value), end: timeToIso($('e').value) };
  const ctx = { now: FIXED_NOW };

  const view = describeResult(checkRoom(request, ROOMS, $('room').value, ctx));
  const el = $('result');
  el.textContent = view.text;
  el.className = view.className;

  const all = $('all');
  all.replaceChildren();
  checkAllRooms(request, ROOMS, ctx).forEach((r) => {
    const room = ROOMS.find((x) => x.id === r.id);
    const li = document.createElement('li');
    li.textContent = `${room.name}: ${describeResult(r).text}`;
    li.className = r.available ? 'ok' : 'no';
    all.append(li);
  });
};

init();
