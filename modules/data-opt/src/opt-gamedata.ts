import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { sync as mkdirp } from 'mkdirp';
import { join } from 'path';

export function optimizeGameData(dataPath: string) {
  mkdirp(join('data', 'game'));
  const basePath = join(dataPath, 'game');
  if (!existsSync(basePath)) {
    console.log('skipping game data');
    return;
  }

  for (const file of readdirSync(basePath)) {
    if (!file.endsWith('.json')) continue;
    console.log(file);
    const json = JSON.parse(readFileSync(join(basePath, file)).toString('utf8'));
    writeFileSync(join('data', 'game', file), JSON.stringify(json));
  }
}