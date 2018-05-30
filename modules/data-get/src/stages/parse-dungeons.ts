import { fromPADTime } from '../api';
import { formatJson, readFile, writeTo } from '../common';

/* tslint:disable:no-bitwise */

type Dungeon = ReturnType<typeof parseDungeon>;
type Floor = ReturnType<typeof parseFloor>;

function parseDungeon(entry: string) {
  const data = entry.split(',');
  if (data.length !== 6) {
    console.log(`residue data for ${data[1]}`);
  }

  return {
    id: Number(data[0]),
    name: data[1],
    once: (Number(data[2]) & 1) !== 0,
    bgId: Number(data[2]) >> 4,
    type: Number(data[3]),
    weekday: Number(data[4]),
    order: Number(data[5]),
    floors: [] as Floor[]
  };
}

function parseFloor(entry: string) {
  const data = entry.split(',');
  let i = 0;
  const floor: any = {};

  floor.id = Number(data[i++]);
  floor.name = data[i++];
  floor.waves = Number(data[i++]);
  floor.rflags1 = Number(data[i++]);
  floor.stamina = Number(data[i++]);
  floor.bgm1 = Number(data[i++]);
  floor.bgm2 = Number(data[i++]);
  floor.rflags2 = Number(data[i++]);
  floor.flags = Number(data[i++]);

  if ((floor.flags & 0x1) !== 0) {
    floor.requirement = {
      dungeonId: Number(data[i++]),
      floorId: Number(data[i++])
    };
  }
  if ((floor.flags & 0x4) !== 0) {
    floor.beginTime = fromPADTime(data[i++]);
  }
  if ((floor.flags & 0x8) !== 0) {
    floor.score = Number(data[i++]);
  }
  if ((floor.flags & 0x10) !== 0) {
    floor.minRank = Number(data[i++]);
  }
  if ((floor.flags & 0x40) !== 0) {
    floor.properties = data[i++].split('|');
  }
  floor.conditions = {
    type: Number(data[i++]),
    values: data.slice(i).map(Number)
  };
  i += floor.conditions.values.length;

  if (i !== data.length)
    console.log(`residue data for ${floor.name}: ${i} ${data.length}`);
  return floor;
}

export async function parseDungeons(basePath: string, versions: { dungeons: number }) {
  const data: { dungeons: string, v: number } =
    JSON.parse(
      await readFile(basePath, 'dungeons', `${versions.dungeons}.json`)
        .then(buf => buf.toString('utf8'))
    );
  const entries = data.dungeons.split('\n');
  console.log(`parsing ${entries.length} dungeon entries (version ${data.v})...`);

  const dungeons: Dungeon[] = [];
  let dungeon!: Dungeon;
  for (const entry of entries) {
    const [type, ...params] = entry.split(';');
    switch (type) {
      case 'd':
        dungeon = parseDungeon(params.join(';'));
        dungeons.push(dungeon);
        break;
      case 'f':
        dungeon.floors.push(parseFloor(params.join(';')));
        break;
      case 'c':
        console.log(`checksum: ${params[0]}`);
        break;
      default:
        console.error(`unknown type: ${type}`);
        return false;
    }
  }
  writeTo(formatJson(dungeons), basePath, 'dungeons.json');
  return true;
}
