import { fromPADTime } from '../api';
import { formatJson, readFile, writeTo } from '../common';

function parseEvent(data: any) {
  return {
    type: data.b,
    begin: fromPADTime(data.s),
    end: fromPADTime(data.e),
    dungeon: data.d,
    floor: data.f,
    amount: data.a,
    item: data.i,
    message: data.m
  };
}

export async function parseEvents(basePath: string, versions: { events: number }) {
  const data: { bonuses: any[], v: number } =
    JSON.parse(
      await readFile(basePath, 'events', `${versions.events}.json`)
        .then(buf => buf.toString('utf8'))
    );
  console.log(`parsing ${data.bonuses.length} events (version ${data.v})...`);

  const events = data.bonuses.map(bonus => parseEvent(bonus));
  writeTo(formatJson(events), basePath, 'events.json');
  return true;
}
