import { range } from 'lodash';
import { formatJson, readFile, writeTo } from '../common';

/* tslint:disable:no-bitwise */

function parseEnemySkill(id: number, next: () => string | null) {
  const name = next();
  const type = Number(next());
  let flags = parseInt(next() || '0', 16);

  const params = range(16).map(() => null) as Array<null | string | number>;
  for (let i = 0; i < params.length; i++) {
    if ((flags & 1) !== 0) {
      const token = next();
      params[i] = isNaN(Number(token)) ? token : Number(token);
    }
    flags >>= 1;
  }
  return { id, name, type, params };
}

export async function parseEnemySkills(basePath: string, versions: { enemySkills: number }) {
  const data: { enemy_skills: string, v: number } =
    JSON.parse(
      await readFile(basePath, 'enemy-skills', `${versions.enemySkills}.json`)
        .then(buf => buf.toString('utf8'))
    );
  console.log(`parsing enemy skills (version ${data.v})...`);
  const inBuf = data.enemy_skills;

  let i = 0;
  let eol = false;
  function search(str: string, begin: number, regex: RegExp) {
    const index = inBuf.slice(begin).search(regex);
    return index < 0 ? str.length : index + begin;
  }
  function nextToken(): string | null {
    if (eol) return null;

    let endIndex;
    let token;
    if (inBuf[i] === "'") {
      endIndex = search(inBuf, i + 1, /',|'\n/);
      token = inBuf.slice(i + 1, endIndex);
      endIndex++;
    } else {
      endIndex = search(inBuf, i, /,|\n/);
      token = inBuf.slice(i, endIndex);
    }

    if (inBuf[endIndex] === '\n')
      eol = true;
    else if (inBuf[endIndex] && inBuf[endIndex] !== ',')
      throw new Error('invalid enemy skill entry format');
    i = endIndex + 1;
    return token;
  }

  const skills = [];
  let id = nextToken();
  while (id !== 'c') {
    skills.push(parseEnemySkill(Number(id), nextToken));

    if (!eol) {
      console.error(`residue data for ${id}`);
      while (!eol) console.error(nextToken());
    }
    eol = false;
    id = nextToken();
  }
  console.log(`checksum: ${nextToken()}`);
  writeTo(formatJson(skills), basePath, 'enemy-skills.json');
  return true;
}
