import { Attributes } from './Attributes';
import { Types } from './Types';

export enum EnemySkillKinds {
  Unknown = 'unknown',
  Nop = 'nop',
  Bind = 'bind',
  BindSkills = 'bind-skills',
  BindAwakenings = 'bind-awakenings',
  ChangeOrbs = 'orb-change',
  OrbDropIncrease = 'orb-drop-incr',
  LeaderChange = 'leader-change',
  TimeChange = 'time-change',
  Gravity = 'gravity',
  EraseBuffs = 'erase-buffs',
  ChangeAttribute = 'change-attr',
  Resolve = 'resolve',
  SetOrbState = 'set-orb-state',
  Angry = 'angry',
  ReduceDamage = 'reduce-damage',
  StatusShield = 'status-shield',
  SelfDestruct = 'self-destruct',
  Transform = 'transform',
  DamageResist = 'damage-resist',
  SkillDelay = 'skill-delay',
  CheckPresence = 'check-presence',
  FixPuzzleStart = 'fix-puzzle-start',
  ChangePlayerStat = 'change-player-stat',
  ChangeInterval = 'change-interval',
  FixTarget = 'fix-target',
  ForbidOrbs = 'forbid-orbs',
  Invincibility = 'invincibility',
  RotateOrbs = 'rotate-orbs',
  Revive = 'revive',
  Buff = 'buff',
  Heal = 'heal',
  FFPlay = 'ff-play',
  PowerHit = 'power-hit',
  Hit = 'hit',
  WithTurns = 'with-turns',
  UpdateVar = 'update-var',
  Branch = 'branch',
  Stop = 'stop',
  DisplayCounter = 'display-counter',
  Preemptive = 'preemptive',
}

export interface EnemySkill {
  id?: number;
  type?: number;
  ai?: number;
  rnd?: number;
  params?: Array<string | number>;

  title?: string;
  message?: string | undefined;
  conditions?: SkillCondition[];
  prob?: number;
  baseProb?: number;

  kind: EnemySkillKinds;
}
export namespace EnemySkill {
  export interface WithValue<T> extends EnemySkill {
    value: T;
  }

  export interface WithTurns extends EnemySkill {
    kind: EnemySkillKinds.WithTurns;
    turns: SkillValue;
    skill: EnemySkill;
  }

  export interface Bind extends EnemySkill {
    kind: EnemySkillKinds.Bind;
    team?: {
      type: BindTeamTarget[];
      count: number;
    };
    attributes?: Attributes[];
    types?: Types[];
  }

  export interface SetOrbState extends EnemySkill {
    kind: EnemySkillKinds.SetOrbState;
    target: OrbsLocation;
    state: 'locked' | 'blind' | 'super-blind' | 'jail' | 'cloud';
    turns?: number;
  }

  export interface DamageResist extends EnemySkill {
    kind: EnemySkillKinds.DamageResist;
    value: number;
    attrs?: Attributes[];
    types?: Types[];
  }

  export interface FixPuzzleStart extends EnemySkill {
    kind: EnemySkillKinds.FixPuzzleStart;
    position?: {
      column: number;
      row: number;
    };
  }

  export interface TimeChange extends EnemySkill {
    kind: EnemySkillKinds.TimeChange;
    difference: number;
    multiplier: number;
  }

  export interface Heal extends EnemySkill {
    kind: EnemySkillKinds.Heal;
    target: 'self' | 'player';
    value: SkillValue;
  }

  export interface ChangePlayerStat extends EnemySkill {
    kind: EnemySkillKinds.ChangePlayerStat;
    stat: 'rcv' | 'maxhp';
    multiplier: number;
    constant: number;
  }

  export interface RotateOrbs extends EnemySkill {
    kind: EnemySkillKinds.RotateOrbs;
    target: OrbsLocation;
    time: number;
  }

  export interface Buff extends EnemySkill {
    kind: EnemySkillKinds.Buff;
    damageVoid?: number;
    damageAbsorb?: number;
    comboAbsorb?: number;
    attrsAbsorb?: Attributes[];
  }

  export interface OrbDropIncrease extends EnemySkill {
    kind: EnemySkillKinds.OrbDropIncrease;
    value: number;
    attrs?: Attributes[];
    locked?: boolean;
  }

  export interface Hit extends EnemySkill {
    kind: EnemySkillKinds.Hit;
    times: SkillValue;
    multiplier: number;
  }

  export interface ChangeOrbs extends EnemySkill {
    kind: EnemySkillKinds.ChangeOrbs;
    changes: OrbChange[];
  }

  export interface UpdateVar extends EnemySkill {
    kind: EnemySkillKinds.UpdateVar;
    variable: 'flags' | 'counter';
    action: 'set' | 'unset' | 'decr' | 'incr' | 'or' | 'xor';
    value: number;
  }

  export interface CheckPresence extends EnemySkill {
    kind: EnemySkillKinds.CheckPresence;
    cardIds: number[];
    branch: number;
  }
}

export interface SkillValue {
  min: number;
  max: number;
}

export enum BindTeamTarget {
  Leader = 'leader',
  Friend = 'friend',
  Members = 'members',
}
export namespace BindTeamTarget {
  export function all() {
    return [BindTeamTarget.Leader, BindTeamTarget.Friend, BindTeamTarget.Members];
  }
}

export interface OrbChange {
  from: OrbsLocation;
  to: Attributes[];
  exclude?: Attributes[];
  locked?: boolean;
}

export enum OrbsLocationKind {
  All = 'all',
  Random = 'random',
  Attributes = 'attributes',
  Columns = 'columns',
  Rows = 'rows',
  Rectangle = 'rectangle',
  Specified = 'specified'
}
export interface OrbsLocation {
  kind: OrbsLocationKind;
}
export namespace OrbsLocation {
  export interface Random extends OrbsLocation {
    kind: OrbsLocationKind.Random;
    count: SkillValue;
  }
  export interface Attrs extends OrbsLocation {
    kind: OrbsLocationKind.Attributes;
    count?: number;
    attrs?: Attributes[];
  }
  export interface Axis extends OrbsLocation {
    kind: OrbsLocationKind.Columns | OrbsLocationKind.Rows;
    ordinals: number[];
  }
  export interface Rectangle extends OrbsLocation {
    kind: OrbsLocationKind.Rectangle;
    column: number;
    row: number;
    width: number;
    height: number;
  }
  export interface Specified extends OrbsLocation {
    kind: OrbsLocationKind.Specified;
    positions: boolean[][];
  }
}

export enum SkillConditionKind {
  EnemyRemains = 'enemy-remains',
  AfterTurns = 'after-turns',
  FlagSet = 'flag-set',
  FlagUnset = 'flag-unset',

  Preemptive = 'preemptive',
  OnDeath = 'on-death',

  HPLessThan = 'hp-less',
  HPGreaterThan = 'hp-greater',

  CounterLessThan = 'counter-less',
  CounterIs = 'counter-is',
  CounterGreaterThan = 'counter-greater',

  LevelLessThan = 'level-less',
  LevelIs = 'level-is',
  LevelGreaterThan = 'level-greater',

  ComboGreaterThan = 'combo-greater',
}
export interface SkillCondition {
  kind: SkillConditionKind;
  value: number;
}