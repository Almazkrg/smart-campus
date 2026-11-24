// 3) UI display only. textContent is used, so user text is never parsed as markup.
import { evaluate, ROOM_A101 } from './practice12.js';

export function mountPractice12(doc) {
  const $ = (id) => doc.getElementById(id);
  ROOM_A101.bookings.forEach((b) => {
    const li = doc.createElement('li');
    li.textContent = `${b.start.slice(11, 16)} - ${b.end.slice(11, 16)}`;
    $('bookings').append(li);
  });
  $('go').addEventListener('click', () => {
    const r = evaluate({ start: $('start').value, duration: $('duration').value, roomStatus: $('status').value });
    $('result').textContent = r.message;
    $('result').className = r.status === 'AVAILABLE' ? 'ok' : r.status === 'INVALID' ? 'invalid' : 'no';
    $('result').dataset.reason = r.reason;
  });
}
