import { flatMap } from 'lodash';
import * as moment from 'moment-timezone';
import * as path from 'path';
import * as sqlite from 'sqlite';
import { api } from '../api';
import { readFile } from '../common';

export async function downloadWaves(basePath: string, apiUrl: string, info: api.PlayerInfo) {
  const events: any[] = JSON.parse((await readFile(basePath, 'events.json')).toString('utf8'));
  const dungeons: any[] = JSON.parse((await readFile(basePath, 'dungeons.json')).toString('utf8'));

  const now = moment.tz('Asia/Tokyo');
  const eventDungeons = events
    .filter(event => now.isBetween(event.begin, event.end))
    .filter(event => event.dungeon && event.type === 6)
    .map(event => event.dungeon);

  const dateFilter = [
    null,
    [1],
    [2],
    [3],
    [4],
    [5],
    null,
    null,
    [0, 6]
  ];
  const available = new Set<string>(flatMap<any, string>(
    dungeons
      .filter(d => d.type !== 0 && d.type !== 2)
      .filter(d => d.weekday === 0 || dateFilter[d.weekday]!.indexOf(now.day()) >= 0)
      .filter(d => d.weekday !== 0 || eventDungeons.indexOf(d.id) >= 0),
    d => d.floors.map((f: any) => `${d.id}:${f.id}`)
  ));

  for (const [d, f, s] of info.player.ndun) {
    const dInfo = dungeons.find(dungeon => dungeon.id === d);
    // tslint:disable-next-line:no-bitwise
    if ((s & 2) !== 0 && d.once)
      available.delete(`${d}:${f}`);
    if (s !== 0 && (dInfo.type === 0 || dInfo.type === 2))
      available.add(`${d}:${f}`);
  }

  const availableIds = Array.from(available.values())
    .map(id => id.split(':'))
    .map(([d, f]) => ({ d: Number(d), f: Number(f) }));

  const db = await sqlite.open(path.join(basePath, 'waves.sqlite3'));
  await db.exec('CREATE TABLE IF NOT EXISTS waves(time TEXT, dungeon INTEGER, floor INTEGER, data TEXT)');

  for (const id of availableIds) {
    const dungeon = dungeons.find(d => d.id === id.d);
    const floor = dungeon.floors.find((f: any) => f.id === id.f);
    console.log(`loading (${id.d}:${id.f}) ${dungeon.name} : ${floor.name}:`);

    let waves;
    try {
      waves = await api.dlWave(id.d, id.f, apiUrl, info);
    } catch (err) {
      console.error('failed to load: ', err);
    }
    if (waves) {
      console.log(waves.data);
      await db.run('INSERT INTO waves(time, dungeon, floor, data) VALUES(?, ?, ?, ?)', [
        waves.time, waves.dungeon, waves.floor, waves.data
      ]);
    }
    await new Promise(r => setTimeout(r, 500 + (Math.random() * 200 - 100)));
  }

  await db.close();
  return true;
}
