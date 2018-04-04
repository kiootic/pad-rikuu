import { Attrs, Types } from "app/types/enums";
import { parseFlags as flags } from 'app/utils/enum';
import { SkillParser, SkillValueKind, SkillValue, SkillCondition, SkillPowerUpKind, SkillPowerUp, Skill, SkillKinds, OrbChange } from 'app/types/skills';
import { flatMap, mapValues } from 'lodash';

namespace v {
  export function percent(value: number): SkillValue.Simple {
    return { kind: SkillValueKind.Percent, value: (value / 100) || 1 };
  }
  export function constant(value: number): SkillValue.Simple {
    return { kind: SkillValueKind.Constant, value: value || 0 };
  }
  export function xMaxHP(value: number): SkillValue.Simple {
    return { kind: SkillValueKind.xMaxHP, value: (value / 100) || 1 };
  }
  export function xHP(value: number): SkillValue.Simple {
    return { kind: SkillValueKind.xHP, value: (value / 100) || 1 };
  }
  export function xATK(value: number): SkillValue.Simple {
    return { kind: SkillValueKind.xATK, value: (value / 100) || 1 };
  }
  export function xRCV(value: number): SkillValue.Simple {
    return { kind: SkillValueKind.xRCV, value: (value / 100) || 1 };
  }
  export function randomATK(min: number, max: number): SkillValue.Scale {
    return { kind: SkillValueKind.RandomATK, min: (min / 100) || 1, max: (max / 100) || 1, scale: 1 };
  }
  export function hpScale(min: number, max: number, scale: number): SkillValue.Scale {
    return { kind: SkillValueKind.HPScale, min: (min / 100) || 1, max: (max / 100) || 1, scale: (scale / 100) || 1 };
  }
  export function xTeamATK(attrs: Attrs[], value: number): SkillValue.WithAttributes {
    return { kind: SkillValueKind.xTeamATK, attrs, value: (value / 100) || 1 };
  }
  export function xTeamRCV(value: number): SkillValue.Simple {
    return { kind: SkillValueKind.xTeamRCV, value: (value / 100) || 1 };
  }
  export function percentAwoken(awokens: number[], value: number): SkillValue.WithAwokens {
    return { kind: SkillValueKind.xAwoken, awokens, value: value / 100 };
  }
}

namespace c {
  export function hp(min: number, max: number): SkillCondition {
    return { hp: { min: min / 100, max: max / 100 } };
  }
  export function exact(type: SkillCondition['exact']['type'], value: number, attrs?: Attrs[] | 'enhanced'): SkillCondition {
    return { exact: { type, value, attrs } };
  }
  export function compo(type: SkillCondition['compo']['type'], ids: number[]): SkillCondition {
    return { compo: { type, ids } };
  }
  export function remainOrbs(count: number): SkillCondition { return { remainOrbs: { count } }; }
  export function useSkill(): SkillCondition { return { useSkill: true }; }
  export function multiplayer(): SkillCondition { return { multiplayer: true }; }
}

namespace p {
  export function mul(values: { hp?: number, atk?: number, rcv?: number } | [number, number]): SkillPowerUp.Mul {
    if (Array.isArray(values)) {
      return {
        kind: SkillPowerUpKind.Multiplier,
        hp: 1,
        atk: values[0] / 100,
        rcv: values[1] / 100,
      };
    } else {
      return {
        kind: SkillPowerUpKind.Multiplier,
        hp: (values.hp / 100) || 1,
        atk: (values.atk / 100) || 1,
        rcv: (values.rcv / 100) || 1
      };
    }
  }
  export function stats(value: number, ...stats: number[]): [number, number] {
    return [
      stats.includes(1) ? value : 100,
      stats.includes(2) ? value : 100
    ];
  }

  function scale(min: number, max: number, baseMul: [number, number], bonusMul: [number, number]) {
    return {
      min,
      max: max || min,
      baseAtk: (baseMul[0] / 100) || 1,
      baseRcv: (baseMul[1] / 100) || 1,
      bonusAtk: (bonusMul[0] / 100) || 0,
      bonusRcv: (bonusMul[1] / 100) || 0,
    };
  }
  export function scaleAttrs(attrs: Attrs[], min: number, max: number, baseMul: [number, number], bonusMul: [number, number]): SkillPowerUp.ScaleAttrs {
    return { kind: SkillPowerUpKind.ScaleAttributes, attrs, ...scale(min, max || (bonusMul.some(Boolean) ? attrs.length : min), baseMul, bonusMul) };
  }
  export function scaleCombos(min: number, max: number, baseMul: [number, number], bonusMul: [number, number]): SkillPowerUp.Scale {
    return { kind: SkillPowerUpKind.ScaleCombos, ...scale(min, max, baseMul, bonusMul) };
  }
  export function scaleMatchLength(attrs: Attrs[], min: number, max: number, baseMul: [number, number], bonusMul: [number, number]): SkillPowerUp.ScaleAttrs {
    return { kind: SkillPowerUpKind.ScaleMatchLength, attrs, ...scale(min, max, baseMul, bonusMul) };
  }
  export function scaleMatchAttrs(attrs: Attrs[][], min: number, max: number, baseMul: [number, number], bonusMul: [number, number]): SkillPowerUp.ScaleMultiAttrs {
    return { kind: SkillPowerUpKind.ScaleMatchAttrs, attrs, ...scale(min, max, baseMul, bonusMul) };
  }
  export function scaleCross(crosses: { single: boolean, attr: Attrs, mul: number }[]): SkillPowerUp.ScaleCross {
    return { kind: SkillPowerUpKind.ScaleCross, crosses: crosses.map(cross => ({ ...cross, mul: (cross.mul / 100) || 1 })) };
  }
  export function scaleAwoken(awokens: number[], value: number): SkillPowerUp.ScaleAwokens {
    return { kind: SkillPowerUpKind.ScaleAwoken, awokens, value: value / 100 };
  }
}

function activeTurns(turns: number, skill: Skill): Skill.ActiveTurns {
  return { kind: SkillKinds.ActiveTurns, turns, skill };
}

function damageEnemy(target: Skill.DamageEnemy['target'], attr: Skill.DamageEnemy['attr'], damage: SkillValue, selfHP?: SkillValue): Skill.DamageEnemy {
  return { kind: SkillKinds.DamageEnemy, target, attr, damage, selfHP };
}

function vampire(attr: Skill.Vampire['attr'], damage: SkillValue, heal: SkillValue): Skill.Vampire {
  return { kind: SkillKinds.Vampire, attr, damage, heal };
}

function reduceDamage(attrs: Skill.ReduceDamage['attrs'], percent: SkillValue, condition?: SkillCondition): Skill.ReduceDamage {
  return { kind: SkillKinds.ReduceDamage, attrs, percent, condition };
}

function heal(value: SkillValue): Skill.WithValue {
  return { kind: SkillKinds.Heal, value };
}

function changeOrbs(...changes: OrbChange[]): Skill.ChangeOrbs {
  return { kind: SkillKinds.ChangeOrbs, changes };
}

function powerUp(attrs: Attrs[] | null, types: Types[] | null, value: SkillPowerUp, condition?: SkillCondition, reduceDamage?: SkillValue): Skill.PowerUp {
  if (value.kind === SkillPowerUpKind.Multiplier) {
    const { hp, atk, rcv } = value as SkillPowerUp.Mul;
    if (hp === 1 && atk === 1 && rcv === 1 && !reduceDamage)
      return null;
  }
  return { kind: SkillKinds.PowerUp, attrs, types, condition, value, reduceDamage };
}

function counterAttack(attr: Skill.CounterAttack['attr'], prob: SkillValue, value: SkillValue): Skill.CounterAttack {
  return { kind: SkillKinds.CounterAttack, attr, prob, value };
}
function setOrbState(orbs: Attrs[] | null, state: Skill.SetOrbState['state']): Skill.SetOrbState {
  return { kind: SkillKinds.SetOrbState, orbs, state };
}
function rateMultiply(value: SkillValue, rate: Skill.RateMultiply['rate']): Skill.RateMultiply {
  return { kind: SkillKinds.RateMultiply, value, rate };
}
function orbDropIncrease(value: SkillValue, attrs: Skill.OrbDropIncrease['attrs']): Skill.OrbDropIncrease {
  return { kind: SkillKinds.OrbDropIncrease, value, attrs };
}

function resolve(min: SkillValue, max: SkillValue): Skill.Resolve {
  return { kind: SkillKinds.Resolve, min, max };
}
function unbind(normal: number, awoken: number): Skill.Unbind {
  return { kind: SkillKinds.Unbind, normal, awoken };
}
function boardChange(attrs: Attrs[]): Skill.BoardChange {
  return { kind: SkillKinds.BoardChange, attrs };
}
function randomSkills(skills: Skill[]): Skill.RandomSkills {
  return { kind: SkillKinds.RandomSkills, skills };
}
function changeAttr(target: Skill.ChangeAttribute['target'], attr: Attrs): Skill.ChangeAttribute {
  return { kind: SkillKinds.ChangeAttribute, target, attr: attr || 0 };
}
function gravity(value: SkillValue): Skill.WithValue {
  return { kind: SkillKinds.Gravity, value };
}
function voidEnemyBuff(buff: Skill.VoidEnemyBuff['buff']): Skill.VoidEnemyBuff {
  return { kind: SkillKinds.VoidEnemyBuff, buff };
}

function skillBoost(value: number): Skill.WithValue<number> { return { kind: SkillKinds.SkillBoost, value }; }
function minMatch(value: number): Skill.WithValue<number> { return { kind: SkillKinds.MinMatchLength, value }; }
function fixedTime(value: number): Skill.WithValue<number> { return { kind: SkillKinds.FixedTime, value }; }
function addCombo(value: number): Skill.WithValue<number> { return { kind: SkillKinds.AddCombo, value }; }
function defBreak(value: SkillValue): Skill.WithValue { return { kind: SkillKinds.DefenseBreak, value }; }
function poison(value: SkillValue): Skill.WithValue { return { kind: SkillKinds.Poison, value }; }
function CTW(value: SkillValue): Skill.WithValue { return { kind: SkillKinds.CTW, value }; }
function autoAttack(value: SkillValue): Skill.WithValue { return { kind: SkillKinds.AutoAttack, value }; }
function autoHeal(value: SkillValue): Skill.WithValue { return { kind: SkillKinds.AutoHeal, value }; }
function timeExtend(value: SkillValue): Skill.WithValue { return { kind: SkillKinds.TimeExtend, value }; }

function delay(): Skill { return { kind: SkillKinds.Delay }; }
function massAttack(): Skill { return { kind: SkillKinds.MassAttack }; }
function dropRefresh(): Skill { return { kind: SkillKinds.DropRefresh }; }
function drum(): Skill { return { kind: SkillKinds.Drum }; }
function leaderChange(): Skill { return { kind: SkillKinds.LeaderChange }; }
function board7x6(): Skill { return { kind: SkillKinds.Board7x6 }; }
function noSkyfall(): Skill { return { kind: SkillKinds.NoSkyfall }; }

type Parsers<Result> = { [type: number]: (...params: number[]) => Skill | Skill[] };

export function createParsers(parser: SkillParser): { [type: number]: (params: number[]) => Skill[] } {
  return mapValues(_createParsers(parser), parser => (params: number[]): Skill[] => {
    const result = parser(...params);
    return (Array.isArray(result) ? result : [result]).filter(Boolean);
  });
}

const _createParsers = (parser: SkillParser): { [type: number]: (...params: number[]) => Skill | Skill[] } => ({
  [0]: (attr, mul) => damageEnemy('all', attr, v.xATK(mul)),
  [1]: (attr, value) => damageEnemy('all', attr, v.constant(value)),
  [2]: (mul) => damageEnemy('single', 'self', v.xATK(mul)),
  [3]: (turns, percent) => activeTurns(turns, reduceDamage('all', v.percent(percent))),
  [4]: (mul) => poison(v.xATK(mul)),
  [5]: (time) => CTW(v.constant(time)),
  [6]: (percent) => gravity(v.xHP(percent)),
  [7]: (mul) => heal(v.xRCV(mul)),
  [8]: (value) => heal(v.constant(value)),
  [9]: (from, to) => changeOrbs({ kind: 'from', from: [from || 0], to: [to || 0] }),
  [10]: () => dropRefresh(),
  [11]: (attr, mul) => powerUp([attr], null, p.mul({ atk: mul })),
  [12]: (mul) => autoAttack(v.xATK(mul)),
  [13]: (mul) => autoHeal(v.xRCV(mul)),
  [14]: (min, max) => resolve(v.percent(min), v.percent(max)),
  [15]: (time) => timeExtend(v.constant(time / 100)),
  [16]: (percent) => reduceDamage('all', v.percent(percent)),
  [17]: (attr, percent) => reduceDamage([attr], v.percent(percent)),
  [18]: (turns) => activeTurns(turns, delay()),
  [19]: (turns, percent) => activeTurns(turns, defBreak(v.percent(percent))),
  [20]: (from1, to1, from2, to2) => changeOrbs({ kind: 'from', from: [from1 || 0], to: [to1 || 0] }, { kind: 'from', from: [from2 || 0], to: [to2 || 0] }),
  [21]: (turns, attr, percent) => activeTurns(turns, reduceDamage([attr], v.percent(percent))),
  [22]: (type, mul) => powerUp(null, [type], p.mul({ atk: mul })),
  [23]: (type, mul) => powerUp(null, [type], p.mul({ hp: mul })),
  [24]: (type, mul) => powerUp(null, [type], p.mul({ rcv: mul })),

  [26]: (mul) => powerUp(null, null, p.mul({ atk: mul })),

  [28]: (attr, mul) => powerUp([attr], null, p.mul({ atk: mul, rcv: mul })),
  [29]: (attr, mul) => powerUp([attr], null, p.mul({ hp: mul, atk: mul, rcv: mul })),
  [30]: (type1, type2, mul) => powerUp(null, [type1, type2], p.mul({ hp: mul })),
  [31]: (type1, type2, mul) => powerUp(null, [type1, type2], p.mul({ atk: mul })),

  [33]: () => drum(),

  [35]: (mul, percent) => vampire('self', v.xATK(mul), v.percent(percent)),
  [36]: (attr1, attr2, percent) => reduceDamage([attr1, attr2], v.percent(percent)),
  [37]: (attr, mul) => damageEnemy('single', attr, v.xATK(mul)),
  [38]: (max, _, percent) => reduceDamage("all", v.percent(percent), max === 100 ? c.hp(max, max) : c.hp(0, max)),
  [39]: (percent, stats1, stats2, mul) => powerUp(null, null, p.mul(p.stats(mul, stats1, stats2)), c.hp(0, percent)),
  [40]: (attr1, attr2, mul) => powerUp([attr1, attr2], null, p.mul({ atk: mul })),
  [41]: (prob, mul, attr) => counterAttack(attr || 0, v.percent(prob), v.percent(mul)),
  [42]: (targetAttr, dmgAttr, value) => damageEnemy(targetAttr, dmgAttr, v.constant(value)),
  [43]: (min, max, percent) => reduceDamage("all", v.percent(percent), c.hp(min, max)),
  [44]: (percent, stats1, stats2, mul) => powerUp(null, null, p.mul(p.stats(mul, stats1, stats2)), c.hp(percent, 100)),
  [45]: (attr, mul) => powerUp([attr], null, p.mul({ hp: mul, atk: mul })),
  [46]: (attr1, attr2, mul) => powerUp([attr1, attr2], null, p.mul({ hp: mul })),

  [48]: (attr, mul) => powerUp([attr], null, p.mul({ hp: mul })),
  [49]: (attr, mul) => powerUp([attr], null, p.mul({ rcv: mul })),
  [50]: (turns, attr, mul) => activeTurns(turns, powerUp([attr], null, p.mul({ atk: mul }))),
  [51]: (turns) => activeTurns(turns, massAttack()),
  [52]: (attr) => setOrbState([attr], 'enhanced'),
  [53]: (mul) => rateMultiply(v.percent(mul), 'drop'),
  [54]: (mul) => rateMultiply(v.percent(mul), 'coin'),
  [55]: (value) => damageEnemy('single', 'fixed', v.constant(value)),
  [56]: (value) => damageEnemy('all', 'fixed', v.constant(value)),

  [58]: (attr, min, max) => damageEnemy('all', attr, v.randomATK(min, max)),
  [59]: (attr, min, max) => damageEnemy('single', attr, v.randomATK(min, max)),
  [60]: (turns, mul, attr) => activeTurns(turns, counterAttack(attr, v.percent(100), v.percent(mul))),
  [61]: (attrs, min, base, bonus, max) => powerUp(null, null, p.scaleAttrs(flags(attrs), min, max, [base, 100], [bonus, 0])),
  [62]: (type, mul) => powerUp(null, [type], p.mul({ hp: mul, atk: mul })),
  [63]: (type, mul) => powerUp(null, [type], p.mul({ hp: mul, rcv: mul })),
  [64]: (type, mul) => powerUp(null, [type], p.mul({ atk: mul, rcv: mul })),
  [65]: (type, mul) => powerUp(null, [type], p.mul({ hp: mul, atk: mul, rcv: mul })),
  [66]: (combo, mul) => powerUp(null, null, p.scaleCombos(combo, combo, [mul, 100], [0, 0])),
  [67]: (attr, mul) => powerUp([attr], null, p.mul({ hp: mul, rcv: mul })),

  [69]: (attr, type, mul) => powerUp([attr], [type], p.mul({ atk: mul })),

  [71]: (...attrs) => boardChange(attrs.filter(attr => attr >= 0)),

  [73]: (attr, type, mul) => powerUp([attr], [type], p.mul({ hp: mul, atk: mul })),

  [75]: (attr, type, mul) => powerUp([attr], [type], p.mul({ atk: mul, rcv: mul })),
  [76]: (attr, type, mul) => powerUp([attr], [type], p.mul({ hp: mul, atk: mul, rcv: mul })),
  [77]: (type1, type2, mul) => powerUp(null, [type1, type2], p.mul({ hp: mul, atk: mul })),

  [79]: (type1, type2, mul) => powerUp(null, [type1, type2], p.mul({ atk: mul, rcv: mul })),

  [84]: (attr, min, max, percent) => damageEnemy("single", attr, v.randomATK(min, max), percent ? v.xHP(percent) : v.constant(1)),
  [85]: (attr, min, max, percent) => damageEnemy("all", attr, v.randomATK(min, max), percent ? v.xHP(percent) : v.constant(1)),
  [86]: (attr, value, _, percent) => damageEnemy("single", attr, v.constant(value), percent ? v.xHP(percent) : v.constant(1)),
  [87]: (attr, value, _, percent) => damageEnemy("all", attr, v.constant(value), percent ? v.xHP(percent) : v.constant(1)),
  [88]: (turns, type, mul) => activeTurns(turns, powerUp(null, [type], p.mul({ atk: mul }))),

  [90]: (turns, attr1, attr2, mul) => activeTurns(turns, powerUp([attr1, attr2], null, p.mul({ atk: mul }))),
  [91]: (attr1, attr2) => setOrbState([attr1, attr2], 'enhanced'),
  [92]: (turns, type1, type2, mul) => activeTurns(turns, powerUp(null, [type1, type2], p.mul({ atk: mul }))),
  [93]: () => leaderChange(),
  [94]: (percent, attr, stats1, stats2, mul) => powerUp([attr], null, p.mul(p.stats(mul, stats1, stats2)), c.hp(0, percent)),
  [95]: (percent, type, stats1, stats2, mul) => powerUp(null, [type], p.mul(p.stats(mul, stats1, stats2)), c.hp(0, percent)),
  [96]: (percent, attr, stats1, stats2, mul) => powerUp([attr], null, p.mul(p.stats(mul, stats1, stats2)), c.hp(percent, 100)),
  [97]: (percent, type, stats1, stats2, mul) => powerUp(null, [type], p.mul(p.stats(mul, stats1, stats2)), c.hp(percent, 100)),
  [98]: (min, base, bonus, max) => powerUp(null, null, p.scaleCombos(min, max, [base, 100], [bonus, 0])),

  [100]: (stats1, stats2, mul) => powerUp(null, null, p.mul(p.stats(mul, stats1, stats2)), c.useSkill()),
  [101]: (combo, mul) => powerUp(null, null, p.mul({ atk: mul }), c.exact('combo', combo)),

  [103]: (combo, stats1, stats2, mul) => powerUp(null, null, p.scaleCombos(combo, combo, p.stats(mul, stats1, stats2), [0, 0])),
  [104]: (combo, attrs, stats1, stats2, mul) => powerUp(flags(attrs), null, p.scaleCombos(combo, combo, p.stats(mul, stats1, stats2), [0, 0])),
  [105]: (rcv, atk) => powerUp(null, null, p.mul({ rcv, atk })),
  [106]: (hp, atk) => powerUp(null, null, p.mul({ hp, atk })),
  [107]: (hp) => powerUp(null, null, p.mul({ hp })),
  [108]: (hp, type, atk) => [powerUp(null, null, p.mul({ hp })), powerUp(null, [type], p.mul({ atk }))],
  [109]: (attrs, len, mul) => powerUp(null, null, p.scaleMatchLength(flags(attrs), len, len, [mul, 100], [0, 0])),
  [110]: (single, attr, min, max, scale) => damageEnemy(single ? 'single' : 'all', attr, v.hpScale(min, max, scale)),
  [111]: (attr1, attr2, mul) => powerUp([attr1, attr2], null, p.mul({ hp: mul, atk: mul })),

  [114]: (attr1, attr2, mul) => powerUp([attr1, attr2], null, p.mul({ hp: mul, atk: mul, rcv: mul })),
  [115]: (attr, mul, percent) => vampire(attr, v.xATK(mul), v.percent(percent)),
  [116]: (...ids) => flatMap(ids, id => parser.parse(id)),
  [117]: (bind, rcv, constant, hp, awokenBind) => [
    rcv ? heal(v.xRCV(rcv)) : hp ? heal(v.xMaxHP(hp)) : constant ? heal(v.constant(constant)) : null,
    (bind || awokenBind) ? unbind(bind || 0, awokenBind || 0) : null,
  ].filter(Boolean),
  [118]: (...ids) => randomSkills(flatMap(ids, id => parser.parse(id))),
  [119]: (attrs, min, base, bonus, max) => powerUp(null, null, p.scaleMatchLength(flags(attrs), min, max, [base, 100], [bonus, 0])),

  [121]: (attrs, types, hp, atk, rcv) => powerUp(flags(attrs), flags(types), p.mul({ hp, atk, rcv })),
  [122]: (percent, attrs, types, atk, rcv) => powerUp(flags(attrs), flags(types), p.mul({ atk, rcv }), c.hp(0, percent)),
  [123]: (percent, attrs, types, atk, rcv) => powerUp(flags(attrs), flags(types), p.mul({ atk, rcv }), c.hp(percent, 100)),
  [124]: (attrs1, attrs2, attrs3, attrs4, attrs5, min, mul, bonus) => {
    const attrs: number[] = [attrs1, attrs2, attrs3, attrs4, attrs5].filter(Boolean);
    return powerUp(null, null, p.scaleMatchAttrs(attrs.map(flags), min, bonus ? attrs.length : min, [mul, 100], [bonus, 0]))
  },
  [125]: (mon1, mon2, mon3, mon4, mon5, hp, atk, rcv) => powerUp(null, null, p.mul({ hp, atk, rcv }), c.compo('card', [mon1, mon2, mon3, mon4, mon5].filter(Boolean))),
  [126]: (attrs, turns, _, percent) => activeTurns(turns, orbDropIncrease(v.percent(percent), flags(attrs))),
  [127]: (cols1, attrs1, cols2, attrs2) => changeOrbs(
    { kind: 'fixed', to: flags(attrs1), type: 'col', positions: flags(cols1) },
    { kind: 'fixed', to: flags(attrs2), type: 'col', positions: flags(cols2) }
  ),
  [128]: (rows1, attrs1, rows2, attrs2) => changeOrbs(
    { kind: 'fixed', to: flags(attrs1), type: 'row', positions: flags(rows1) },
    { kind: 'fixed', to: flags(attrs2), type: 'row', positions: flags(rows2) }
  ),
  [129]: (attrs, types, hp, atk, rcv, rAttrs, rPercent) => [
    powerUp(flags(attrs), flags(types), p.mul({ hp, atk, rcv })),
    !!rPercent && reduceDamage(flags(rAttrs), v.percent(rPercent))
  ],
  [130]: (percent, attrs, types, atk, rcv, rAttrs, rPercent) => [
    powerUp(flags(attrs), flags(types), p.mul({ atk, rcv }), c.hp(0, percent)),
    !!rPercent && reduceDamage(flags(rAttrs), v.percent(rPercent), c.hp(0, percent))
  ],
  [131]: (percent, attrs, types, atk, rcv, rAttrs, rPercent) => [
    powerUp(flags(attrs), flags(types), p.mul({ atk, rcv }), c.hp(percent, 100)),
    !!rPercent && reduceDamage(flags(rAttrs), v.percent(rPercent), c.hp(percent, 100))
  ],
  [132]: (turns, time, percent) => activeTurns(turns, timeExtend(time ? v.constant(time / 10) : v.percent(percent))),
  [133]: (attrs, types, atk, rcv) => powerUp(flags(attrs), flags(types), p.mul({ atk, rcv }), c.useSkill()),
  [136]: (attrs1, hp1, atk1, rcv1, attrs2, hp2, atk2, rcv2) => [
    powerUp(flags(attrs1), null, p.mul({ hp: hp1, atk: atk1, rcv: rcv1 })),
    powerUp(flags(attrs2), null, p.mul({ hp: hp2, atk: atk2, rcv: rcv2 })),
  ],
  [137]: (types1, hp1, atk1, rcv1, types2, hp2, atk2, rcv2) => [
    powerUp(null, flags(types1), p.mul({ hp: hp1, atk: atk1, rcv: rcv1 })),
    powerUp(null, flags(types2), p.mul({ hp: hp2, atk: atk2, rcv: rcv2 })),
  ],
  [138]: (...ids) => flatMap(ids, id => parser.parse(id)),
  [139]: (attrs, types, percent1, less1, mul1, percent2, less2, mul2) => [
    powerUp(flags(attrs), flags(types), p.mul({ atk: mul1 }), less1 ? c.hp(0, percent1) : c.hp(percent1, 100)),
    powerUp(flags(attrs), flags(types), p.mul({ atk: mul2 }), less1 ?
      (less2 ? c.hp(percent1, percent2) : c.hp(percent2, 100)) :
      (less2 ? c.hp(0, percent2) : c.hp(percent2, percent1))
    ),
  ],
  [140]: (attrs) => setOrbState(flags(attrs), 'enhanced'),
  [141]: (count, to, exclude) => changeOrbs({ kind: 'gen', to: flags(to), exclude: flags(exclude), count }),
  [142]: (turns, attr) => activeTurns(turns, changeAttr('self', attr)),

  [144]: (teamAttrs, mul, single, dmgAttr) => damageEnemy(single ? 'single' : 'all', dmgAttr, v.xTeamATK(flags(teamAttrs), mul)),
  [145]: (mul) => heal(v.xTeamRCV(mul)),
  [146]: (turns) => skillBoost(turns),

  [148]: (percent) => rateMultiply(v.percent(percent), 'exp'),
  [149]: (mul) => powerUp(null, null, p.mul({ rcv: mul }), c.exact('match-length', 4, [Attrs.Heart])),
  [150]: (_, mul) => powerUp(null, null, p.mul({ atk: mul }), c.exact('match-length', 5, 'enhanced')),
  [151]: (mul, _, percent) => [
    powerUp(null, null, p.scaleCross([{ single: true, attr: Attrs.Heart, mul }]), null, v.percent(percent)),
  ],
  [152]: (attrs) => setOrbState(flags(attrs), 'locked'),
  [153]: (attr) => changeAttr('opponent', attr),
  [154]: (from, to) => changeOrbs({ kind: 'from', to: flags(to), from: flags(from) }),
  [155]: (attrs, types, hp, atk, rcv) => powerUp(flags(attrs), flags(types), p.mul({ hp, atk, rcv }), c.multiplayer()),
  [156]: (turns, awoken1, awoken2, awoken3, type, mul) => activeTurns(turns, type === 2 ?
    powerUp(null, null, p.scaleAwoken([awoken1, awoken2, awoken3].filter(Boolean), mul)) :
    reduceDamage('all', v.percentAwoken([awoken1, awoken2, awoken3].filter(Boolean), mul))
  ),
  [157]: (attr1, mul1, attr2, mul2, attr3, mul3) => powerUp(null, null, p.scaleCross([
    { single: false, attr: attr1, mul: mul1 },
    { single: false, attr: attr2, mul: mul2 },
    { single: false, attr: attr3, mul: mul3 }
  ].filter(cross => cross.mul))),
  [158]: (len, attrs, types, hp, atk, rcv) => [
    minMatch(len),
    powerUp(flags(attrs), flags(types), p.mul({ hp, atk, rcv }))
  ],
  [159]: (attrs, min, base, bonus, max) => powerUp(null, null, p.scaleMatchLength(flags(attrs), min, max, [base, 100], [bonus, 0])),
  [160]: (turns, combo) => activeTurns(turns, addCombo(combo)),
  [161]: (percent) => gravity(v.xMaxHP(percent)),
  [162]: () => board7x6(),
  [163]: (attrs, types, hp, atk, rcv, rAttrs, rPercent) => [
    noSkyfall(),
    powerUp(flags(attrs), flags(types), p.mul({ hp, atk, rcv })),
    !!rPercent && reduceDamage(flags(rAttrs), v.percent(rPercent)),
  ],
  [164]: (attrs1, attrs2, attrs3, attrs4, min, atk, rcv, bonus) => {
    const attrs: number[] = [attrs1, attrs2, attrs3, attrs4].filter(Boolean);
    return powerUp(null, null, p.scaleMatchAttrs(attrs.map(flags), min, attrs.length, [atk, rcv], [bonus, bonus]))
  },
  [165]: (attrs, min, baseAtk, baseRcv, bonusAtk, bonusRcv, max) => powerUp(null, null, p.scaleAttrs(flags(attrs), min, max, [baseAtk, baseRcv], [bonusAtk, bonusRcv])),
  [166]: (min, baseAtk, baseRcv, bonusAtk, bonusRcv, max) => powerUp(null, null, p.scaleCombos(min, max, [baseAtk, baseRcv], [bonusAtk, bonusRcv])),
  [167]: (attrs, min, baseAtk, baseRcv, bonusAtk, bonusRcv, max) => powerUp(null, null, p.scaleMatchLength(flags(attrs), min, max, [baseAtk, baseRcv], [bonusAtk, bonusRcv])),

  [169]: (combo, mul, percent) => powerUp(null, null, p.scaleCombos(combo, combo, [mul, 100], [0, 0]), null, v.percent(percent)),
  [170]: (attrs, min, mul, percent) => powerUp(null, null, p.scaleAttrs(flags(attrs), min, min, [mul, 100], [0, 0]), null, v.percent(percent)),
  [171]: (attrs1, attrs2, attrs3, attrs4, min, mul, percent) => {
    const attrs: number[] = [attrs1, attrs2, attrs3, attrs4].filter(Boolean);
    return powerUp(null, null, p.scaleMatchAttrs(attrs.map(flags), min, min, [mul, 0], [0, 0]), null, v.percent(percent))
  },
  [172]: () => setOrbState(null, 'unlocked'),
  [173]: (turns, attrAbsorb, _, damageAbsorb) => activeTurns(turns, voidEnemyBuff(
    attrAbsorb ? 'attr-absorb' : 'damage-absorb'
  )),
  [175]: (series1, series2, series3, hp, atk, rcv) => powerUp(null, null, p.mul({ hp, atk, rcv }), c.compo('series', [series1, series2, series3].filter(Boolean))),

  [177]: (_0, _1, _2, _3, _4, remains, mul) => [
    noSkyfall(),
    powerUp(null, null, p.mul({ atk: mul }), c.remainOrbs(remains))
  ],
  [178]: (time, attrs, types, hp, atk, rcv) => [
    fixedTime(time),
    powerUp(flags(attrs), flags(types), p.mul({ hp, atk, rcv }))
  ],
  [179]: (turns, value, percent) => activeTurns(turns, heal(value ? v.constant(value) : v.xMaxHP(percent))),
  [180]: (turns, percent) => activeTurns(turns, orbDropIncrease(v.percent(percent), 'enhanced')),

  [182]: (attrs, len, mul, percent) => powerUp(null, null, p.scaleMatchLength(flags(attrs), len, len, [mul, 100], [0, 0]), null, v.percent(percent)),
  [183]: (attrs, types, percent1, atk1, rcv1, percent2, atk2, rcv2) => [
    powerUp(flags(attrs), flags(types), p.mul({ atk: atk1, rcv: rcv1 }), c.hp(percent1, 100)),
    powerUp(flags(attrs), flags(types), p.mul({ atk: atk2, rcv: rcv2 }), c.hp(0, percent2)),
  ],
  [184]: (turns) => activeTurns(turns, noSkyfall()),
  [185]: (time, attrs, types, hp, atk, rcv) => [
    timeExtend(v.constant(time / 100)),
    powerUp(flags(attrs), flags(types), p.mul({ hp, atk, rcv })),
  ],
  [186]: (attrs, types, hp, atk, rcv) => [
    board7x6(),
    powerUp(flags(attrs), flags(types), p.mul({ hp, atk, rcv })),
  ],
  [188]: (value) => damageEnemy('single', 'fixed', v.constant(value))
});
