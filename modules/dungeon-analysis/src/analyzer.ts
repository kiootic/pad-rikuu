import { existsSync, readFileSync, writeFileSync } from 'fs';
import { flatten, max, min, uniqWith } from 'lodash';
import { join } from 'path';
import { open } from 'sqlite';
import { DungeonData, Enemy } from './dungeonData';
import { DungeonEnemy, DungeonInfo, DungeonWave } from './dungeonInfo';

export async function analyze(dataPath: string) {
  const db = await open(join(dataPath, 'game', 'waves.sqlite3'));

  const infos: DungeonInfo[] = [];

  const dungeons = (await db.all('SELECT DISTINCT dungeon FROM waves ORDER BY dungeon'))
    .map<number>(entry => entry.dungeon);

  for (const dungeon of dungeons) {
    const floors = (await db.all('SELECT DISTINCT floor FROM waves WHERE dungeon = ? ORDER BY floor', dungeon))
      .map<number>(entry => entry.floor);

    for (const floor of floors) {
      const data = (await db.all('SELECT * FROM waves WHERE dungeon = ? AND floor = ?', dungeon, floor))
        .map<string>(entry => entry.data);
      infos.push(analyzeFloor(dungeon, floor, data));
    }
  }

  const result = JSON.stringify(infos, null, 4);
  writeFileSync(join(dataPath, 'game', 'waves.json'), result);
  if (existsSync(join(dataPath, 'game', 'version.json'))) {
    const version = JSON.parse(readFileSync(join(dataPath, 'game', 'version.json')).toString('utf8'));
    version.waves = Date.now();
    writeFileSync(join(dataPath, 'game', 'version.json'), JSON.stringify(version, null, 4));
  }
}

function analyzeFloor(dungeon: number, floor: number, data: string[]): DungeonInfo {
  const info: DungeonInfo = {
    dungeon, floor,
    invades: [],
    waves: []
  };
  const samples = data.map(datum => DungeonData.parse(datum));
  console.log(`dungeon: ${dungeon}; floor: ${floor}; samples: ${samples.length}`);

  const numWaves = samples[0].length;
  if (!samples.every(waves => waves.length === numWaves))
    console.error('inconsistent number of waves:', samples.map(waves => waves.length));

  for (let i = 0; i < numWaves; i++) {
    const waveSamples = samples.map(waves => waves[i]);

    const type = waveSamples.map(wave => isSameEnemies(wave, waveSamples[0])).every(Boolean) ? 'template' : 'random';
    const allEnemies = flatten(waveSamples);
    const uniqueEnemies = type === 'template' ? waveSamples[0] : uniqWith(allEnemies, isSameEnemy);

    const waveEnemies: DungeonEnemy[] = [];
    for (const enemy of uniqueEnemies) {
      const instances = allEnemies.filter(instance => isSameEnemy(instance, enemy));
      const waveEnemy: DungeonEnemy = {
        id: enemy.id,
        level: enemy.level,
        drops: [],
        plus: instances.every(instance => instance.plus === instances[0].plus) ? instances[0].plus : 0
      };

      for (const instance of instances) {
        if (!instance.dropId) continue;
        if (!waveEnemy.drops.some(({ id, level }) => id === instance.dropId && level === instance.dropLevel))
          waveEnemy.drops.push({
            id: instance.dropId,
            level: instance.dropLevel
          });
      }
      waveEnemies.push(waveEnemy);
    }

    const waveSizes = waveSamples.map(wave => wave.length);
    const minSize = min(waveSizes)!;
    const maxSize = max(waveSizes)!;

    const waveInfo: DungeonWave = {
      type,
      minEnemies: minSize,
      maxEnemies: maxSize,
      enemies: waveEnemies
    };
    info.waves.push(waveInfo);
  }
  return info;
}

function isSameEnemies(a: Enemy[], b: Enemy[]) {
  return a.length === b.length && a.map((enemy, i) => isSameEnemy(enemy, b[i])).every(Boolean);
}

function isSameEnemy(a: Enemy, b: Enemy) {
  return a.id === b.id && a.level === b.level;
}