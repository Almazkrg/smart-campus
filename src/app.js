// Smart Campus - UI wiring. Takes `doc` as a parameter so it can be tested with jsdom.
// Business rules live in availability.js, filtering in filtering.js, texts in messages.js.
import { checkRoom, checkAllRooms } from './availability.js';
import { filterRooms, listEquipment } from './filtering.js';
import { ROOMS, FIXED_NOW } from './fixtures.js';
import { EMPTY_STATE_TEXT, describeResult, describeRoom, timeToIso } from './messages.js';

const hhmm = (iso) => iso.slice(11, 16);

export function mountApp(doc, rooms = ROOMS) {
  const $ = (id) => doc.getElementById(id);
  let checked = false; // has the user pressed "Check availability" for the current inputs?

  // One shared renderer for every list on the page: [{text, className?}] -> <li> items.
  const renderItems = (list, items) => {
    list.replaceChildren();
    items.forEach(({ text, className }) => {
      const li = doc.createElement('li');
      li.textContent = text;
      if (className) li.className = className;
      list.append(li);
    });
  };

  const readRequirements = () => ({
    attendees: $('n').value,
    equipment: [...doc.querySelectorAll('#equipment input:checked')].map((box) => box.value),
  });
  const visibleRooms = () => filterRooms(rooms, readRequirements());
  const selectedRoomId = () => $('room').value;

  const clearResult = () => {
    $('result').textContent = '';
    $('result').className = '';
  };

  function renderBookings() {
    const room = rooms.find((r) => r.id === selectedRoomId());
    const items = room && room.bookings.length
      ? room.bookings.map((b) => ({ text: `${hhmm(b.start)} - ${hhmm(b.end)}` }))
      : [{ text: 'No bookings' }];
    renderItems($('bookings'), room ? items : []);
  }

  function runCheck() {
    const visible = visibleRooms();
    if (visible.length === 0) return clearResult();
    const request = { start: timeToIso($('s').value), end: timeToIso($('e').value) };
    const ctx = { now: FIXED_NOW };
    const view = describeResult(checkRoom(request, rooms, selectedRoomId(), ctx));
    $('result').textContent = view.text;
    $('result').className = view.className;
    renderItems($('all'), checkAllRooms(request, visible, ctx).map((r) => {
      const room = rooms.find((x) => x.id === r.id);
      const v = describeResult(r);
      return { text: `${room.name}: ${v.text}`, className: v.className };
    }));
  }

  // F4 + F5: rebuild the room list from the filters, keep the selection if possible, refresh result.
  function refresh() {
    const visible = visibleRooms();
    const previous = selectedRoomId();
    const select = $('room');
    select.replaceChildren();
    visible.forEach((room) => {
      const opt = doc.createElement('option');
      opt.value = room.id;
      opt.textContent = describeRoom(room);
      select.append(opt);
    });
    if (visible.some((r) => r.id === previous)) select.value = previous;
    const empty = visible.length === 0;
    $('empty').textContent = empty ? EMPTY_STATE_TEXT : '';
    $('empty').hidden = !empty;
    select.disabled = empty;
    $('go').disabled = empty;
    renderBookings();
    if (empty) { clearResult(); renderItems($('all'), []); return; }
    if (checked) runCheck(); else { clearResult(); renderItems($('all'), []); }
  }

  listEquipment(rooms).forEach((item) => {
    const label = doc.createElement('label');
    label.className = 'eq';
    const box = doc.createElement('input');
    box.type = 'checkbox';
    box.value = item;
    box.addEventListener('change', refresh);
    label.append(box, ` ${item}`);
    $('equipment').append(label);
  });
  $('n').addEventListener('input', refresh);
  $('room').addEventListener('change', refresh);
  $('go').addEventListener('click', () => { checked = true; runCheck(); });
  refresh();
}
