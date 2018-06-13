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

  export function cardStats(card: Card, level: number) {
    function curve(c: Curve | { min: number, max?: number, scale?: number }) {
      let value = Curve.valueAt(level, card.maxLevel, {
        min: c.min,
        max: c.max || (c.min * card.maxLevel),
        scale: c.scale || 1
      });

      if (level > card.maxLevel) {
        const exceed = level - card.maxLevel;
        value += c.max ? (c.max * (card.limitBreakIncr / 100) * (exceed / 11)) : c.min * exceed;
      }
      return value;
    }

    return {
      maxLevel: card.maxLevel + (card.limitBreakIncr > 0 ? 11 : 0),
      hp: curve(card.hp),
      atk: curve(card.atk),
      rcv: curve(card.rcv),
      exp: Curve.valueAt(level, card.maxLevel, card.exp) + Math.max(0, level - card.maxLevel - 1) * 5000000,
      coin: curve({ min: card.sellPrice / 10 }),
      feedExp: curve({ min: card.feedExp / 4 }),
    };
  }

  export function enemyStats(card: Card, level: number) {
    function curve(c: Curve | { min: number, max?: number, scale?: number }) {
      return Curve.valueAt(level, card.enemy.maxLevel, {
        min: c.min,
        max: c.max || (c.min * card.enemy.maxLevel),
        scale: c.scale || 1
      });
    }

    return {
      maxLevel: card.enemy.maxLevel,
      hp: curve(card.enemy.hp),
      atk: curve(card.enemy.atk),
      def: curve(card.enemy.def),
      exp: curve({ min: card.enemy.exp / 2 }),
      coin: curve({ min: card.enemy.coin / 2 }),
    };
  }
}