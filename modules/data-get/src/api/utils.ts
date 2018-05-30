import { chunk, padStart } from 'lodash';
import moment from 'moment-timezone';

export function demanglePlayerID(id: string) {
  const DisplayMap = 175824963;

  let n = DisplayMap;
  const display = Array(9);
  for (let i = 0; i < 9; i++) {
    display[(n % 10) - 1] = id[8 - i];
    n = Math.floor(n / 10);
  }
  return chunk(display, 3).map(segment => segment.join('')).join(',');
}

export function fromPADTime(date: string) {
  if (!date) return '';
  if (date.length < 12) console.error(`invalid PAD time: ${date}`);

  return moment.tz([
    Number(date.slice(0, 2)) + 2000,
    Number(date.slice(2, 4)) - 1,
    Number(date.slice(4, 6)),
    Number(date.slice(6, 8)),
    Number(date.slice(8, 10)),
    Number(date.slice(10, 12)),
    Number(date.slice(12)),
  ], 'Asia/Tokyo').toISOString();
}

export function toPADTime(date = moment()) {
  const d = date.tz('Asia/Tokyo');
  return [d.year() - 2000, d.month() + 1, d.date(), d.hour(), d.minute(), d.second()]
    .map(value => padStart(value.toString(), 2, '0')).join('');
}

export function toPADTimeMS(date = moment()) {
  return toPADTime(date) + padStart(date.millisecond().toString(), 3, '0');
}
