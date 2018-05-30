import { Attributes } from './Attributes';
import { Types } from './Types';

export enum SkillValueKind {
  Percent = 'mul',
  Constant = 'const',
  xMaxHP = 'mul-maxhp',
  xHP = 'mul-hp',
  xATK = 'mul-atk',
  xRCV = 'mul-rcv',
  RandomATK = 'random-atk',
  HPScale = 'hp-scale',
  xTeamATK = 'mul-team-atk',
  xTeamRCV = 'mul-team-rcv',
  xAwakenings = 'mul-awakenings',
}
export interface SkillValue {
  kind: SkillValueKind;
}
export namespace SkillValue {
  export interface Simple extends SkillValue {
    value: number;
  }
  export interface Scale extends SkillValue {
    min: number;
    max: number;
    scale: number;
  }
  export interface WithAttributes extends Simple {
    attrs: Attributes[];
  }
  export interface WithAwakenings extends Simple {
    awakenings: number[];
  }

  export function isLess(value: SkillValue) {
    if (value.kind === SkillValueKind.Percent) return (value as Simple).value < 1;
    if (value.kind === SkillValueKind.Constant) return (value as Simple).value < 0;
    return false;
  }
}

export interface SkillCondition {
  hp?: { min: number, max: number };
  useSkill?: boolean;
  multiplayer?: boolean;
  exact?: { type: 'combo' | 'match-length', value: number, attrs: Attributes[] | 'enhanced' };
  compo?: { type: 'card' | 'series', ids: number[] };
  cross?: { attrs: Attributes[] };
  remainOrbs?: { count: number };
}

export type OrbChange = { to: Attributes[] } & (
  { kind: 'from', from: Attributes[] } |
  { kind: 'gen', exclude: Attributes[], count: number } |
  { kind: 'fixed', positions: number[], type: 'row' | 'col' }
);

export enum SkillPowerUpKind {
  Multiplier = 'mul',
  ScaleAttributes = 'scale-attrs',
  ScaleCombos = 'scale-combos',
  ScaleMatchLength = 'scale-match-len',
  ScaleMatchAttrs = 'scale-match-attrs',
  ScaleCross = 'scale-cross',
  ScaleAwakenings = 'scale-awakenings',
}
export interface SkillPowerUp {
  kind: SkillPowerUpKind;
}
export namespace SkillPowerUp {
  export interface Mul extends SkillPowerUp {
    hp: number;
    atk: number;
    rcv: number;
  }
  export interface Scale extends SkillPowerUp {
    min: number;
    max: number;
    baseAtk: number;
    baseRcv: number;
    bonusAtk: number;
    bonusRcv: number;
  }
  export interface ScaleAttrs extends Scale {
    attrs: Attributes[];
  }
  export interface ScaleMultiAttrs extends Scale {
    matches: Attributes[][];
  }
  export interface ScaleCross extends SkillPowerUp {
    crosses: Array<{
      single: boolean,
      attr: Attributes,
      mul: number
    }>;
  }
  export interface ScaleAwakenings extends SkillPowerUp {
    awakenings: number[];
    value: number;
  }
}

export enum SkillKinds {
  Unknown = 'unknown',
  ActiveTurns = 'active-turns',
  DamageEnemy = 'damage-enemy',
  Vampire = 'vampire',
  ReduceDamage = 'reduce-damage',
  Heal = 'heal',
  ChangeOrbs = 'change-orbs',
  PowerUp = 'power-up',
  CounterAttack = 'counter-attack',
  SetOrbState = 'set-orb-state',
  RateMultiply = 'rate-mul',
  OrbDropIncrease = 'orb-drop-incr',
  Resolve = 'resolve',
  Delay = 'delay',
  DefenseBreak = 'def-break',
  MassAttack = 'mass-attack',
  BoardChange = 'board-change',
  Unbind = 'unbind',
  RandomSkills = 'random-skills',
  ChangeAttribute = 'change-attr',
  SkillBoost = 'skill-boost',
  AddCombo = 'add-combo',
  VoidEnemyBuff = 'void-enemy-buff',
  Poison = 'poison',
  CTW = 'ctw',
  Gravity = 'gravity',
  FollowAttack = 'follow-attack',
  AutoHeal = 'auto-heal',
  TimeExtend = 'time-extend',
  DropRefresh = 'drop-refresh',
  LeaderChange = 'leader-change',
  MinMatchLength = 'min-match-len',
  FixedTime = 'fixed-time',
  Drum = 'drum',
  Board7x6 = '7x6-board',
  NoSkyfall = 'no-skyfall',
}
export interface Skill {
  id?: number;
  type?: number;
  params?: number[];
  kind: SkillKinds;
}
export namespace Skill {
  export interface WithValue<T=SkillValue> extends Skill {
    value: T;
  }

  export interface ActiveTurns extends Skill {
    kind: SkillKinds.ActiveTurns;
    turns: number;
    skill: Skill;
  }
  export interface DamageEnemy extends Skill {
    kind: SkillKinds.DamageEnemy;
    target: 'all' | 'single' | Attributes;
    attr: Attributes | 'self' | 'fixed';
    damage: SkillValue;
    selfHP?: SkillValue;
  }
  export interface Vampire extends Skill {
    kind: SkillKinds.Vampire;
    attr: Attributes | 'self';
    damage: SkillValue;
    heal: SkillValue;
  }
  export interface ReduceDamage extends Skill {
    kind: SkillKinds.ReduceDamage;
    attrs: 'all' | Attributes[];
    percent: SkillValue;
    condition?: SkillCondition;
  }
  export interface ChangeOrbs extends Skill {
    kind: SkillKinds.ChangeOrbs;
    changes: OrbChange[];
  }
  export interface PowerUp extends Skill {
    kind: SkillKinds.PowerUp;
    attrs: Attributes[] | null;
    types: Types[] | null;
    value: SkillPowerUp | null;
    condition?: SkillCondition;
    reduceDamage?: SkillValue;
  }
  export interface CounterAttack extends Skill {
    kind: SkillKinds.CounterAttack;
    attr: Attributes | 'self';
    prob: SkillValue;
    value: SkillValue;
  }
  export interface SetOrbState extends Skill {
    kind: SkillKinds.SetOrbState;
    orbs: Attributes[] | null;
    state: 'enhanced' | 'locked' | 'unlocked';
  }
  export interface RateMultiply extends Skill {
    kind: SkillKinds.RateMultiply;
    value: SkillValue;
    rate: 'drop' | 'coin' | 'exp';
  }
  export interface OrbDropIncrease extends Skill {
    kind: SkillKinds.OrbDropIncrease;
    value: SkillValue;
    attrs: Attributes[] | 'enhanced';
  }
  export interface Resolve extends Skill {
    kind: SkillKinds.Resolve;
    min: SkillValue;
    max: SkillValue;
  }
  export interface Unbind extends Skill {
    kind: SkillKinds.Unbind;
    normal: number;
    awakenings: number;
  }
  export interface BoardChange extends Skill {
    kind: SkillKinds.BoardChange;
    attrs: Attributes[];
  }
  export interface RandomSkills extends Skill {
    kind: SkillKinds.RandomSkills;
    skills: Skill[][];
  }
  export interface ChangeAttribute extends Skill {
    kind: SkillKinds.ChangeAttribute;
    target: 'self' | 'opponent';
    attr: Attributes;
  }
  export interface VoidEnemyBuff extends Skill {
    kind: SkillKinds.VoidEnemyBuff;
    buffs: Array<'attr-absorb' | 'damage-absorb'>;
  }
}