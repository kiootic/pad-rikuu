import { flatMap } from 'lodash';
import { Attributes, EnemySkill as SkillData, Types } from 'src/models';
import {
  BindTeamTarget, EnemySkill as Skill,
  EnemySkillKinds as SkillKinds, OrbChange, OrbsLocation, OrbsLocationKind, SkillConditionKind, SkillValue
} from 'src/models/ParsedEnemySkill';
import { parseFlags as flags } from 'src/utils';

type SkillParser = (id: number) => Skill;
type SkillParsers = {
  parser: SkillParser;
  ai: number;
  rnd: number;
} & { [type: number]: (...params: number[]) => Skill };

/* tslint:disable:no-bitwise */

export function parse(lookup: (id: number) => SkillData | undefined, id: number, ai: number, rnd: number): Skill {
  // tslint:disable-next-line:no-shadowed-variable
  function parser(skillId: number, ai?: number, rnd?: number): Skill {
    const skill = lookup(skillId);
    if (!skill) {
      return { id: skillId, kind: SkillKinds.Unknown };
    }

    const params = skill.params.slice(1).map(value => (value || 0) as number);
    const skillBase = {
      id: skillId,
      type: skill.type,
      params
    };

    if (!parsers[skill.type]) {
      return { ...skillBase, kind: SkillKinds.Unknown };
    }

    let result: Skill = parsers[skill.type].apply({ parser, ai, rnd }, params);
    if ([
      SkillKinds.CheckPresence,
      SkillKinds.Branch,
      SkillKinds.UpdateVar,
      SkillKinds.Stop,
      SkillKinds.Nop,
      SkillKinds.Sequence,
      SkillKinds.Choose,
    ].indexOf(result.kind) < 0) {
      const insertSkill = (s: Skill, last: boolean) => {
        if (result.kind !== SkillKinds.Sequence) {
          const conds = result.conditions;
          result.conditions = undefined;
          result = sequence(result);
          result.conditions = conds;
        }
        const seq = (result as Skill.WithValue<Skill[]>).value;
        seq.splice(last ? seq.length : 0, 0, s);
      };

      if (params[10])
        result = cond.hpLess(params[10] / 100, result);
      if (params[12]) {
        insertSkill(updateVar('flags', 'set', params[12]), true);
        result = cond.flagUnset(params[12], result);
      }
      if (params[13]) {
        insertSkill(hit(v.constant(1), params[13] / 100), false);
      }

      result.prob = ai && ai / 100;
      result.baseProb = rnd && rnd / 100;
    }

    const title = skill.name;
    const message = skill.params[0] || undefined;
    return { ...skillBase, ai, rnd, title, message, ...result };
  }

  return parser(id, ai, rnd);
}

namespace v {
  export function constant(value: number): SkillValue { return { min: value, max: value }; }
  export function range(min: number, max: number): SkillValue { return { min, max }; }
}

namespace loc {
  export function all() { return { kind: OrbsLocationKind.All }; }
  export function attributes(attrs?: Attributes[], count?: number): OrbsLocation.Attrs {
    return { kind: OrbsLocationKind.Attributes, attrs, count };
  }
  export function random(count: SkillValue): OrbsLocation.Random {
    return { kind: OrbsLocationKind.Random, count };
  }
  export function columns(col: number): OrbsLocation.Axis {
    return { kind: OrbsLocationKind.Columns, ordinals: flags(col) };
  }
  export function rows(col: number): OrbsLocation.Axis {
    return { kind: OrbsLocationKind.Rows, ordinals: flags(col) };
  }
  export function rect(column: number, row: number, width: number, height: number): OrbsLocation.Rectangle {
    return { kind: OrbsLocationKind.Rectangle, column, row, width, height };
  }
  export function specified(row1: number, row2: number, row3: number, row4: number, row5: number): OrbsLocation.Specified {
    return {
      kind: OrbsLocationKind.Specified,
      positions: [row1, row2, row3, row4, row5].map(row => {
        const marks: boolean[] = [];
        for (let i = 0; i < 6; i++)
          marks.push((row & (1 << i)) !== 0);
        return marks;
      })
    };
  }
}

namespace cond {
  function withCondition<T extends Skill>(kind: SkillConditionKind, value: number, skill: T): T {
    if (!skill.conditions)
      skill.conditions = [];
    skill.conditions.push({ kind, value });
    return skill;
  }

  export function enemyRemains<T extends Skill>(count: number, skill: T) {
    return withCondition(SkillConditionKind.EnemyRemains, count, skill);
  }
  export function afterTurns<T extends Skill>(count: number, skill: T) {
    return withCondition(SkillConditionKind.AfterTurns, count, skill);
  }
  export function flagSet<T extends Skill>(flag: number, skill: T) {
    return withCondition(SkillConditionKind.FlagSet, flag, skill);
  }
  export function flagUnset<T extends Skill>(flag: number, skill: T) {
    return withCondition(SkillConditionKind.FlagUnset, flag, skill);
  }

  export function hpLess<T extends Skill>(percent: number, skill: T) {
    return withCondition(SkillConditionKind.HPLessThan, percent, skill);
  }
  export function hpGreater<T extends Skill>(percent: number, skill: T) {
    return withCondition(SkillConditionKind.HPGreaterThan, percent, skill);
  }
  export function counterLess<T extends Skill>(value: number, skill: T) {
    return withCondition(SkillConditionKind.CounterLessThan, value, skill);
  }
  export function counterIs<T extends Skill>(value: number, skill: T) {
    return withCondition(SkillConditionKind.CounterIs, value, skill);
  }
  export function counterGreater<T extends Skill>(value: number, skill: T) {
    return withCondition(SkillConditionKind.CounterGreaterThan, value, skill);
  }
  export function levelLess<T extends Skill>(value: number, skill: T) {
    return withCondition(SkillConditionKind.LevelLessThan, value, skill);
  }
  export function levelIs<T extends Skill>(value: number, skill: T) {
    return withCondition(SkillConditionKind.LevelIs, value, skill);
  }
  export function levelGreater<T extends Skill>(value: number, skill: T) {
    return withCondition(SkillConditionKind.LevelGreaterThan, value, skill);
  }
  export function comboGreater<T extends Skill>(value: number, skill: T) {
    return withCondition(SkillConditionKind.ComboGreaterThan, value, skill);
  }

  export function whenPreemptive<T extends Skill>(skill: T) {
    return withCondition(SkillConditionKind.Preemptive, 0, skill);
  }
  export function whenDeath<T extends Skill>(skill: T) {
    return withCondition(SkillConditionKind.OnDeath, 0, skill);
  }
}

function withTurns(turns: SkillValue, skill: Skill): Skill.WithTurns {
  return {
    kind: SkillKinds.WithTurns,
    turns, skill
  };
}

function preemptive(skill?: Skill): Skill {
  return skill ? cond.whenPreemptive(skill) : { kind: SkillKinds.Preemptive };
}

function onDeath(...skills: Skill[]): Skill.WithValue<Skill[]> {
  return cond.whenDeath({
    kind: SkillKinds.Sequence,
    value: skills
  });
}

function choose(skills: Array<Skill | null>): Skill.WithValue<Skill[]> {
  return {
    kind: SkillKinds.Choose,
    value: skills.filter(Boolean) as Skill[]
  };
}

function sequence(...skills: Array<Skill | null>): Skill.WithValue<Skill[]> {
  return {
    kind: SkillKinds.Sequence,
    value: skills.filter(Boolean) as Skill[]
  };
}

function bind(team?: { flags: number, count: number }, attrs?: Attributes[], types?: Types[]): Skill.Bind {
  return {
    kind: SkillKinds.Bind,
    team: team && {
      type: [
        (team.flags & 1) && BindTeamTarget.Leader,
        (team.flags & 2) && BindTeamTarget.Friend,
        (team.flags & 4) && BindTeamTarget.Members,
      ].filter((t): t is BindTeamTarget => typeof t === 'string'),
      count: team.count
    },
    attributes: attrs, types
  };
}

function changeOrbs(...changes: OrbChange[]): Skill.ChangeOrbs {
  return {
    kind: SkillKinds.ChangeOrbs,
    changes
  };
}

function setOrbState(target: OrbsLocation, state: Skill.SetOrbState['state'], turns?: number): Skill.SetOrbState {
  return {
    kind: SkillKinds.SetOrbState,
    target, state, turns
  };
}

function rotateOrbs(target: OrbsLocation, seconds: number): Skill.RotateOrbs {
  return {
    kind: SkillKinds.RotateOrbs,
    target, time: seconds
  };
}

function hit(times: SkillValue, multiplier: number): Skill.Hit {
  return {
    kind: SkillKinds.Hit,
    times, multiplier
  };
}

function timeChange(difference: number, multiplier: number): Skill.TimeChange {
  return {
    kind: SkillKinds.TimeChange,
    difference, multiplier
  };
}

function changeAttribute(...attrs: Attributes[]): Skill.WithValue<Attributes[]> {
  return {
    kind: SkillKinds.ChangeAttribute,
    value: attrs
  };
}

function forbidOrbs(attrs: Attributes[]): Skill.WithValue<Attributes[]> {
  return {
    kind: SkillKinds.ForbidOrbs,
    value: attrs
  };
}

function orbDropIncrease(value: number, attrs?: Attributes[], locked?: boolean): Skill.OrbDropIncrease {
  return {
    kind: SkillKinds.OrbDropIncrease,
    value, attrs, locked
  };
}

function damageResist(value: number, attrs?: Attributes[], types?: Types[]): Skill.DamageResist {
  return {
    kind: SkillKinds.DamageResist,
    value, attrs, types
  };
}

function checkPresence(ids: number[], branchTarget: number): Skill.CheckPresence {
  return {
    kind: SkillKinds.CheckPresence,
    cardIds: ids,
    branch: branchTarget
  };
}

function fixPuzzleStart(position?: { column: number, row: number }): Skill.FixPuzzleStart {
  return {
    kind: SkillKinds.FixPuzzleStart,
    position
  };
}

function changePlayerStat(stat: Skill.ChangePlayerStat['stat'], multiplier: number, constant: number): Skill.ChangePlayerStat {
  return {
    kind: SkillKinds.ChangePlayerStat,
    stat, multiplier, constant
  };
}

function changeInterval(interval: number): Skill.WithValue<number> {
  return {
    kind: SkillKinds.ChangeInterval,
    value: interval
  };
}

function invincibility(active: boolean): Skill.WithValue<boolean> {
  return {
    kind: SkillKinds.Invincibility,
    value: active
  };
}

function heal(value: SkillValue, target: Skill.Heal['target']): Skill.Heal {
  return {
    kind: SkillKinds.Heal,
    value, target
  };
}

function updateVar(
  variable: Skill.UpdateVar['variable'],
  action: Skill.UpdateVar['action'],
  value: number
): Skill.UpdateVar {
  return {
    kind: SkillKinds.UpdateVar,
    variable, action, value
  };
}

function branch(target: number): Skill.WithValue<number> {
  return { kind: SkillKinds.Branch, value: target };
}

function buff(params: {
  damageVoid?: number;
  damageAbsorb?: number;
  comboAbsorb?: number;
  attrsAbsorb?: Attributes[]
}): Skill.Buff {
  return {
    kind: SkillKinds.Buff,
    ...params
  };
}

function angry(value: SkillValue): Skill.WithValue<SkillValue> { return { kind: SkillKinds.Angry, value }; }
function powerHit(value: SkillValue): Skill.WithValue<SkillValue> { return { kind: SkillKinds.PowerHit, value }; }
function gravity(value: SkillValue): Skill.WithValue<SkillValue> { return { kind: SkillKinds.Gravity, value }; }
function revive(value: SkillValue): Skill.WithValue<SkillValue> { return { kind: SkillKinds.Revive, value }; }
function resolve(value: SkillValue): Skill.WithValue<SkillValue> { return { kind: SkillKinds.Resolve, value }; }
function reduceDamage(value: SkillValue): Skill.WithValue<SkillValue> { return { kind: SkillKinds.ReduceDamage, value }; }
function skillDelay(value: SkillValue): Skill.WithValue<SkillValue> { return { kind: SkillKinds.SkillDelay, value }; }

function nop(): Skill { return { kind: SkillKinds.Nop }; }
function statusShield(): Skill { return { kind: SkillKinds.StatusShield }; }
function eraseBuffs(): Skill { return { kind: SkillKinds.EraseBuffs }; }
function bindSkills(): Skill { return { kind: SkillKinds.BindSkills }; }
function bindAwakenings(): Skill { return { kind: SkillKinds.BindAwakenings }; }
function selfDestruct(): Skill { return { kind: SkillKinds.SelfDestruct }; }
function transform(): Skill { return { kind: SkillKinds.Animation }; }
function leaderChange(): Skill { return { kind: SkillKinds.LeaderChange }; }
function fixTarget(): Skill { return { kind: SkillKinds.FixTarget }; }
function ffplay(): Skill { return { kind: SkillKinds.FFAnimation }; }
function stop(): Skill { return { kind: SkillKinds.Stop }; }
function displayCounter(): Skill { return { kind: SkillKinds.DisplayCounter }; }

const parsers: SkillParsers = {
  parser: () => ({} as Skill),
  ai: 0, rnd: 0,

  [0]() { return nop(); },
  [1](count, min, max) { return withTurns(v.range(min, max), bind({ flags: 7, count })); },
  [2](attr, min, max) { return withTurns(v.range(min, max), bind(undefined, [attr])); },
  [3](type, min, max) { return withTurns(v.range(min, max), bind(undefined, undefined, [type])); },
  [4](from, to) { return changeOrbs({ from: from === -1 ? loc.all() : loc.attributes([from]), to: [to] }); },
  [5]() { return setOrbState(loc.all(), 'blind'); },
  [6]() { return eraseBuffs(); },
  [7](min, max) { return heal(v.range(min / 100, max / 100), 'self'); },
  [8](min, max) { return powerHit(v.range(1 + min / 100, 1 + max / 100)); },



  [12](from) { return changeOrbs({ from: loc.attributes([from]), to: [Attributes.Jammer] }); },
  [13](count) { return changeOrbs({ from: loc.attributes(undefined, count), to: [Attributes.Jammer] }); },
  [14](min, max) { return withTurns(v.range(min, max), bindSkills()); },
  [15](min, max, mul) { return hit(v.range(min, max), mul / 100); },
  [16]() { return nop(); },
  [17](count, turns, mul) { return cond.enemyRemains(count, withTurns(v.constant(turns), angry(v.constant(mul / 100)))); },
  [18](turns, mul) { return withTurns(v.constant(turns), angry(v.constant(mul / 100))); },
  [19](count, turns, mul) { return cond.afterTurns(count, withTurns(v.constant(turns), angry(v.constant(mul / 100)))); },
  [20](turns) { return withTurns(v.constant(turns), statusShield()); },

  [22]() { return updateVar('flags', 'set', this.ai); },
  [23]() { return cond.flagSet(this.ai, branch(this.rnd)); },
  [24]() { return updateVar('flags', 'unset', this.ai); },
  [25]() { return updateVar('counter', 'set', this.ai); },
  [26]() { return updateVar('counter', 'incr', 1); },
  [27]() { return updateVar('counter', 'decr', 1); },
  [28]() { return cond.hpLess(this.ai / 100, branch(this.rnd)); },
  [29]() { return cond.hpGreater(this.ai / 100, branch(this.rnd)); },
  [30]() { return cond.counterLess(this.ai, branch(this.rnd)); },
  [31]() { return cond.counterIs(this.ai, branch(this.rnd)); },
  [32]() { return cond.counterGreater(this.ai, branch(this.rnd)); },
  [33]() { return cond.levelLess(this.ai, branch(this.rnd)); },
  [34]() { return cond.levelIs(this.ai, branch(this.rnd)); },
  [35]() { return cond.levelGreater(this.ai, branch(this.rnd)); },
  [36]() { return stop(); },
  [37]() { return displayCounter(); },
  [38]() { return cond.counterIs(this.ai, updateVar('counter', 'set', this.rnd)); },
  [39](turns, time, mul) { return withTurns(v.constant(turns), timeChange(-time / 10, (mul / 100) || 1)); },
  [40]() { return selfDestruct(); },


  [43]() { return cond.flagSet(this.ai, branch(this.rnd)); },
  [44]() { return updateVar('flags', 'or', this.ai); },
  [45]() { return updateVar('flags', 'xor', this.ai); },
  [46](attr1, attr2, attr3, attr4, attr5) { return changeAttribute(attr1, attr2, attr3, attr4, attr5); },
  [47](_, mul) { return preemptive(hit(v.constant(1), mul / 100)); },
  [48](mul, from, to) {
    return sequence(
      hit(v.constant(1), mul / 100),
      changeOrbs({ from: from === -1 ? loc.attributes(undefined, 1) : loc.attributes([from]), to: [to] })
    );
  },
  [49](level) { return cond.levelGreater(level, preemptive()); },
  [50](mul) { return gravity(v.constant(mul / 100)); },

  [52](mul) { return revive(v.constant(mul / 100)); },
  [53](min, max, attrs) { return withTurns(v.range(min, max), buff({ attrsAbsorb: flags(attrs) })); },
  [54](target, min, max) { return withTurns(v.range(min, max), bind({ flags: target || 7, count: 1 })); },
  [55](min, max) { return heal(v.range(min / 100, max / 100), 'player'); },
  [56](from) { return changeOrbs({ from: loc.attributes([from]), to: [Attributes.Poison] }); },



  [60](count) { return changeOrbs({ from: loc.random(v.constant(count)), to: [Attributes.Poison] }); },

  [62](mul) {
    return sequence(
      hit(v.constant(1), mul / 100),
      setOrbState(loc.all(), 'blind')
    );
  },
  [63](mul, min, max, target, count) {
    return sequence(
      hit(v.constant(1), mul / 100),
      withTurns(v.range(min, max), bind({ flags: target || 7, count }))
    );
  },
  [64](mul, count) {
    return sequence(
      hit(v.constant(1), mul / 100),
      changeOrbs({ from: loc.random(v.constant(count)), to: [Attributes.Poison] })
    );
  },
  [65](count, min, max) { return withTurns(v.range(min, max), bind({ flags: 4, count })); },
  [66]() { return nop(); },
  [67](min, max, combo) { return withTurns(v.range(min, max), buff({ comboAbsorb: combo })); },
  [68](attrs, min, max, mul) { return withTurns(v.range(min, max), orbDropIncrease(mul / 100, flags(attrs))); },
  [69]() { return onDeath(transform()); },

  [71](turns, _, damage) { return withTurns(v.constant(turns), buff({ damageVoid: damage })); },
  [72](attrs, mul) { return damageResist(mul / 100, flags(attrs)); },
  [73](mul) { return resolve(v.constant(mul / 100)); },
  [74](turns, mul) { return withTurns(v.constant(turns), reduceDamage(v.constant(mul / 100))); },
  [75](turns) { return withTurns(v.constant(turns), leaderChange()); },
  [76](col1, attrs1, col2, attrs2, col3, attrs3, col4, attrs4) {
    return sequence(
      col1 && changeOrbs({ from: loc.columns(col1), to: flags(attrs1) }) || null,
      col2 && changeOrbs({ from: loc.columns(col2), to: flags(attrs2) }) || null,
      col3 && changeOrbs({ from: loc.columns(col3), to: flags(attrs3) }) || null,
      col4 && changeOrbs({ from: loc.columns(col4), to: flags(attrs4) }) || null
    );
  },
  [77](col1, attrs1, col2, attrs2, col3, attrs3, mul) {
    return sequence(
      hit(v.constant(1), mul / 100),
      col1 && changeOrbs({ from: loc.columns(col1), to: flags(attrs1) }) || null,
      col2 && changeOrbs({ from: loc.columns(col2), to: flags(attrs2) }) || null,
      col3 && changeOrbs({ from: loc.columns(col3), to: flags(attrs3) }) || null
    );
  },
  [78](row1, attrs1, row2, attrs2, row3, attrs3, row4, attrs4) {
    return sequence(
      row1 && changeOrbs({ from: loc.rows(row1), to: flags(attrs1) }) || null,
      row2 && changeOrbs({ from: loc.rows(row2), to: flags(attrs2) }) || null,
      row3 && changeOrbs({ from: loc.rows(row3), to: flags(attrs3) }) || null,
      row4 && changeOrbs({ from: loc.rows(row4), to: flags(attrs4) }) || null
    );
  },
  [79](row1, attrs1, row2, attrs2, row3, attrs3, mul) {
    return sequence(
      hit(v.constant(1), mul / 100),
      row1 && changeOrbs({ from: loc.rows(row1), to: flags(attrs1) }) || null,
      row2 && changeOrbs({ from: loc.rows(row2), to: flags(attrs2) }) || null,
      row3 && changeOrbs({ from: loc.rows(row3), to: flags(attrs3) }) || null
    );
  },

  [81](mul, ...attrs) {
    return sequence(
      hit(v.constant(1), mul / 100),
      changeOrbs({ from: loc.all(), to: attrs.slice(0, attrs.indexOf(-1)) })
    );
  },
  [82]() { return hit(v.constant(1), 1); },
  [83](...ids) { return choose(flatMap(ids.slice(0, ids.indexOf(0)), id => this.parser(id))); },
  [84](attrs) { return changeOrbs({ from: loc.all(), to: flags(attrs) }); },
  [85](mul, attrs) {
    return sequence(
      hit(v.constant(1), mul / 100),
      changeOrbs({ from: loc.all(), to: flags(attrs) })
    );
  },
  [86](min, max) { return heal(v.range(min / 100, max / 100), 'self'); },
  [87](turns, damage) { return withTurns(v.constant(turns), buff({ damageAbsorb: damage })); },
  [88](turns) { return withTurns(v.constant(turns), bindAwakenings()); },
  [89](min, max) { return skillDelay(v.range(min, max)); },
  [90](...ids) { return checkPresence(ids.slice(0, ids.indexOf(0)), this.rnd); },

  [92](count, attrs, exclude) { return changeOrbs({ from: loc.random(v.constant(count)), to: flags(attrs), exclude: flags(exclude) }); },
  [93]() { return ffplay(); },
  [94](attrs, count) { return setOrbState(loc.attributes(flags(attrs), count), 'locked'); },
  [95](id) { return onDeath(this.parser(id)); },
  [96](attrs, min, max, mul) { return withTurns(v.range(min, max), orbDropIncrease(mul / 100, attrs === -1 ? Attributes.orbs() : flags(attrs), true)); },
  [97](turns, min, max) { return setOrbState(loc.random(v.range(min, max)), 'super-blind', turns); },
  [98](turns, row1, row2, row3, row4, row5) { return setOrbState(loc.specified(row1, row2, row3, row4, row5), 'super-blind', turns); },
  [99](col, turns) { return setOrbState(loc.columns(col), 'jail'); },
  [100](row, turns) { return setOrbState(loc.rows(row), 'jail'); },
  [101](random, column, row) { return fixPuzzleStart(!random && { column, row } || undefined); },
  [102](_0, count, _2, _3, _4, _5, _6, locked) { return changeOrbs({ from: loc.random(v.constant(count)), to: [Attributes.Bomb], locked: locked !== 0 }); },
  [103](_0, row1, row2, row3, row4, row5, _6, locked) { return changeOrbs({ from: loc.specified(row1, row2, row3, row4, row5), to: [Attributes.Bomb], locked: locked !== 0 }); },
  [104](turns, width, height, column, row) { return setOrbState(loc.rect(column, row, width, height), 'cloud', turns); },
  [105](turns, mul) { return withTurns(v.constant(turns), changePlayerStat('rcv', mul / 100, 0)); },
  [106](mul, turns) { return cond.hpLess(mul / 100, changeInterval(turns)); },
  [107](turns, attrs) { return withTurns(v.constant(turns), forbidOrbs(flags(attrs))); },
  [108](mul, from, to) {
    return sequence(
      hit(v.constant(1), mul / 100),
      changeOrbs({ from: loc.attributes(flags(from)), to: flags(to) })
    );
  },
  [109](turns, time, count) { return withTurns(v.constant(turns), rotateOrbs(loc.random(v.constant(count)), time / 100)); },
  [110](turns, time, row1, row2, row3, row4, row5) { return withTurns(v.constant(turns), rotateOrbs(loc.specified(row1, row2, row3, row4, row5), time / 100)); },
  [111](mul, constant, turns) { return withTurns(v.constant(turns), changePlayerStat('maxhp', (mul / 100) || 1, constant)); },
  [112](turns) { return withTurns(v.constant(turns), fixTarget()); },
  [113]() { return cond.comboGreater(this.ai, branch(this.rnd)); },




  [118](types, mul) { return damageResist(mul / 100, undefined, flags(types)); },
  [119](turns) { return withTurns(v.constant(turns), invincibility(true)); },
  [120]() { return cond.enemyRemains(this.ai, branch(this.rnd)); },
  [121]() { return invincibility(false); },
  [122](count, turns) { return cond.enemyRemains(count, changeInterval(turns)); },
  [123](turns) { return withTurns(v.constant(turns), invincibility(true)); }
};