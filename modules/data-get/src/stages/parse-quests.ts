import { fromPADTime } from '../api';
import { formatJson, readFile, writeTo } from '../common';

/* tslint:disable:no-bitwise */

function parseQuest(entry: string) {
  const data = entry.split(',');
  let i = 0;
  const result: any = {};

  if (data[i++] !== 'A') {
    console.error(`unknown entry type: ${data[0]}`);
    return null;
  }

  result.id = Number(data[i++]);
  result.category = Number(data[i++]);
  result.group = Number(data[i++]);
  result.name = data[i++];
  result.reward = {
    type: Number(data[i++]),
    param: Number(data[i++])
  };
  result.condition = {
    type: Number(data[i++]),
    params: [Number(data[i++])]
  };

  const flags = Number(data[i++]);
  if ((flags & 0x1) !== 0) {
    result.order = Number(data[i++]);
  }
  if ((flags & 0x2) !== 0) {
    result.requirement = Number(data[i++]);
  }
  if ((flags & 0x4) !== 0) {
    result.beginTime = fromPADTime(data[i++]);
  }
  if ((flags & 0x8) !== 0) {
    result.endTime = fromPADTime(data[i++]);
  }
  if ((flags & 0x10) !== 0) {
    result.message = data[i++];
  }

  result.condition.params.push(...data.slice(i).map(Number));
  return result;
}

export async function parseQuests(basePath: string, versions: { quests: number }) {
  const data: { d: string, v: number } =
    JSON.parse(
      await readFile(basePath, 'quests', `${versions.quests}.json`)
        .then(buf => buf.toString('utf8'))
    );
  const entries = data.d.split('\n');
  console.log(`parsing ${entries.length} quest entries (version ${data.v})...`);

  const quests = entries.map(entry => parseQuest(entry));
  writeTo(formatJson(quests), basePath, 'quests.json');
  return true;
}
