import { compact, kebabCase } from 'lodash';
import { fromPADTime } from '../api';
import { formatJson, readFile, writeTo } from '../common';

type Shop = ReturnType<typeof parseShop>;
type ShopItem = ReturnType<typeof parsePet> | ReturnType<typeof parseDungeon>;

function parseShop(entry: string) {
  const data = entry.split(',');
  if (data.length !== 6) {
    console.log('residue data for shop');
  }

  return {
    begin: fromPADTime(data[1]),
    end: fromPADTime(data[2]),
    color1: data[3],
    color2: data[4],
    message: data[5],
    items: [] as ShopItem[]
  };
}

function parsePet(entry: string) {
  const data = entry.split(',');
  if (data.length !== 7) {
    console.log('residue data for pet item');
  }

  return {
    type: 'dungeon',
    id: Number(data[1]),
    price: Number(data[2]),
    amount: Number(data[3]),
    message: Number(data[4]),
    unk1: Number(data[5]),
    unk2: Number(data[6]),
  };
}

function parseDungeon(entry: string) {
  const data = entry.split(',');
  if (data.length !== 5) {
    console.log('residue data for dungeon item');
  }

  return {
    type: 'dungeon',
    id: Number(data[1]),
    price: Number(data[2]),
    amount: Number(data[3]),
    message: Number(data[4]),
  };
}


export async function parseShops(basePath: string, versions: { mpShop: number, dungeonShop: number }) {
  const names = { mpShop: 'mp shop', dungeonShop: 'dungeon shop' };
  for (const key of Object.keys(names) as Array<keyof typeof versions>) {
    const name = names[key];
    const data: { d: string, v: string } =
      JSON.parse(
        await readFile(basePath, kebabCase(key), `${versions[key]}.json`)
          .then(buf => buf.toString('utf8'))
      );
    const entries: string[] = compact(data.d.split('\n'));
    console.log(`parsing ${entries.length} ${name} entries (version ${data.v})...`);

    const shops: Shop[] = [];
    let shop!: Shop;
    for (const entry of entries) {
      switch (entry[0]) {
        case 'T':
          shop = parseShop(entry);
          shops.push(shop);
          break;
        case 'P':
          shop.items.push(parsePet(entry));
          break;
        case 'D':
          shop.items.push(parseDungeon(entry));
          break;
        default:
          console.error(`unknown shop entry: ${entry}`);
          return false;
      }
    }
    writeTo(formatJson(shops), basePath, `${kebabCase(key)}.json`);
  }
  return true;
}
