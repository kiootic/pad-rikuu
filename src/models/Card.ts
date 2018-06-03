import { Curve } from 'src/models/Curve';

export interface Card {
  isEmpty: boolean;

  id: number;
  name: string;
  rarity: number;
  cost: number;
  attrs: number[];
  types: number[];
  canAssist: boolean;
  
  evoRootId: number;
  evoBaseId: number;
  isUltEvo: boolean;
  evoMaterials: number[];
  unevoMaterials: number[];

  maxLevel: number;
  sellMP: number;
  sellPrice: number;
  feedExp: number;

  hp: Curve;
  atk: Curve;
  rcv: Curve;
  exp: Curve;

  awakenings: number[];
  superAwakenings: number[];
  limitBreakIncr: number;

  activeSkillId: number;
  leaderSkillId: number;

  enemy: {
    countdown: number;
    hp: Curve;
    atk: Curve;
    def: Curve;
    maxLevel: number;
    coin: number;
    exp: number;
    skills: Array<{
      id: number;
      ai: number;
      rnd: number;
    }>;
  };
}

export namespace Card {
  export function mainId(arg: Card | number) {
    if (typeof arg === 'object')
      arg = arg.id;
    return Math.floor(arg % 100000);
  }

  export function section(arg: Card | number) {
    if (typeof arg === 'object')
      arg = arg.id;
    return Math.floor(arg / 100000);
  }
}