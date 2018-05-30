import { compact, range } from 'lodash';
import { formatJson, readFile, writeTo } from '../common';

/* tslint:disable:no-bitwise */

function parseCard(data: any[]) {
  const card: any = {
    attrs: [],
    types: []
  };
  let i = 0;

  function readCurve() {
    return {
      min: data[i++],
      max: data[i++],
      scale: data[i++],
    };
  }

  card.id = data[i++];
  card.name = data[i++];
  card.attrs.push(data[i++]);
  card.attrs.push(data[i++]);

  card.isUltEvo = data[i++] !== 0;

  card.types.push(data[i++]);
  card.types.push(data[i++]);

  card.rarity = data[i++];
  card.cost = data[i++];
  card.unk01 = data[i++];
  card.maxLevel = data[i++];
  card.feedExp = data[i++];
  card.isEmpty = data[i++] === 1;
  card.sellPrice = data[i++];

  card.hp = readCurve();
  card.atk = readCurve();
  card.rcv = readCurve();
  card.exp = { min: 0, max: data[i++], scale: data[i++] };

  card.activeSkillId = data[i++];
  card.leaderSkillId = data[i++];

  card.enemy = {
    countdown: data[i++],
    hp: readCurve(),
    atk: readCurve(),
    def: readCurve(),
    maxLevel: data[i++],
    coin: data[i++],
    exp: data[i++]
  };

  card.evoBaseId = data[i++];
  card.evoMaterials = [data[i++], data[i++], data[i++], data[i++], data[i++]];
  card.unevoMaterials = [data[i++], data[i++], data[i++], data[i++], data[i++]];
  card.unk02 = data[i++];
  card.unk03 = data[i++];
  card.unk04 = data[i++];
  card.unk05 = data[i++];
  card.unk06 = data[i++];
  card.unk07 = data[i++];

  const numSkills = data[i++];
  card.enemy.skills = range(numSkills).map(() => ({
    id: data[i++],
    param1: data[i++],
    param2: data[i++]
  }));

  const numAwakening = data[i++];
  card.awakenings = range(numAwakening).map(() => data[i++]);

  card.superAwakenings = compact(data[i++].split(',')).map(Number);
  card.evoRootId = data[i++];
  card.seriesId = data[i++];
  card.types.push(data[i++]);
  card.sellMP = data[i++];
  card.latentAwakeningId = data[i++];
  card.collabId = data[i++];
  const flags = data[i++];
  card.unk08 = flags;
  card.canAssist = (flags & 1) !== 0;
  card.altName = data[i++];
  card.limitBreakIncr = data[i++];
  if (i !== data.length)
    console.log(`residue data for #${card.id}: ${i} ${data.length}`);
  return card;
}

export async function parseCards(basePath: string, versions: { cards: number }) {
  const data: { card: any[], v: number } =
    JSON.parse(
      await readFile(basePath, 'cards', `${versions.cards}.json`)
        .then(buf => buf.toString('utf8'))
    );
  console.log(`parsing ${data.card.length} cards (version ${data.v})...`);

  const cards = data.card.map((card: any) => parseCard(card));
  writeTo(formatJson(cards), basePath, 'cards.json');
  return true;
}
