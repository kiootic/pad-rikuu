import { fromPADTime } from '../api';
import { formatJson, readFile, writeTo } from '../common';

function parseEntry(entry: string) {
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
  result.reward = {
    id: Number(data[i++]),
    amount: Number(data[i++])
  };
  result.flags = Number(data[i++]);
  result.beginTime1 = fromPADTime(data[i++]);
  result.endTime1 = fromPADTime(data[i++]);
  result.beginTime2 = fromPADTime(data[i++]);
  result.endTime2 = fromPADTime(data[i++]);
  result.message = data[i++];
  result.requirement = {
    amount: Number(data[i++]),
    ids: data.slice(++i).map(Number)
  };
  return result;
}

export async function parseExchange(basePath: string, versions: { monsterExchange: number }) {
  const data: { d: string, v: number } =
    JSON.parse(
      await readFile(basePath, 'monster-exchange', `${versions.monsterExchange}.json`)
        .then(buf => buf.toString('utf8'))
    );
  const entries = data.d.split('\n');
  console.log(`parsing ${entries.length} exchange entries (version ${data.v})...`);

  const exchange = entries.map(entry => parseEntry(entry));
  writeTo(formatJson(exchange), basePath, 'monster-exchange.json');
  return true;
}
