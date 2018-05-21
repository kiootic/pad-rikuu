import { Skill, SkillKinds, SkillValue, SkillValueKind, SkillPowerUp, SkillPowerUpKind, SkillCondition } from "app/types/skills";
import { Attrs, Types } from "app/types/enums";
import { upperFirst, flatMap } from 'lodash';
import { Fragment } from "react";
import css from 'styles/renderer/skills.scss';

const arrow = <span className={css.icon}>&#10144;</span>;
const arrowDouble = <span className={css.icon}>&#10234;</span>;
const arrowUp = <i className={`fa fa-angle-double-up ${css.icon}`} />;
const multiply = <span className={css.icon}>&#215;</span>;
const shield = <i className={`fa fa-shield-alt ${css.icon}`} />;
const cross = <span className={css.icon}>&#10060;</span>;
const plus = <span className={css.icon}>+</span>;

function stats(stat: 'maxhp' | 'hp' | 'atk' | 'rcv' | 'teamatk' | 'teamrcv') {
  switch (stat) {
    case 'maxhp':
      return <span className={css.stats} key={stat}>Max HP</span>;
    case 'teamatk':
      return <span className={css.stats} key={stat}>Team ATK</span>;
    case 'teamrcv':
      return <span className={css.stats} key={stat}>Team RCV</span>;
    default:
      return <span className={css.stats} key={stat}>{stat.toUpperCase()}</span>;
  }
}

function join<T>(array: T[], separator: any = ', '): any[] {
  return flatMap(array.filter(Boolean), elem => [separator, elem]).slice(1);
}

function dispNum(num: number) {
  return Number(num.toFixed(2)).toString();
}

function renderAttribute(attrs: Attrs | Attrs[], separator?: any) {
  const render = (attr: Attrs) =>
    <span key={`attr-${attr}`} className={[css.attr, css[`attr-${attr}`]].join(' ')}>{Attrs.names[attr]}</span>;

  if (Array.isArray(attrs)) {
    return join(attrs.map(render), separator);
  } else {
    return [render(attrs)];
  }
}

function renderTypes(types: Types | Types[], separator?: any) {
  const render = (type: Types) =>
    <span key={`type-${type}`} className={[css.type, css[`type-${type}`]].join(' ')}>{Types.names[type]}</span>;

  if (Array.isArray(types)) {
    return join(types.map(render), separator);
  } else {
    return [render(types)];
  }
}

function renderValue(_value: SkillValue, unit?: string) {
  switch (_value.kind) {
    case SkillValueKind.Percent: {
      const { value } = _value as SkillValue.Simple;
      return <span>{dispNum(value * 100)}%</span>;
    }
    case SkillValueKind.Constant: {
      const { value } = _value as SkillValue.Simple;
      return <span>{dispNum(value)}{unit ? ` ${unit}` : ''}</span>;
    }
    case SkillValueKind.xMaxHP: {
      const { value } = _value as SkillValue.Simple;
      return <span>{dispNum(value * 100)}% of {stats('maxhp')}</span>;
    }
    case SkillValueKind.xHP: {
      const { value } = _value as SkillValue.Simple;
      return <span>{dispNum(value * 100)}% of {stats('hp')}</span>;
    }
    case SkillValueKind.xATK: {
      const { value } = _value as SkillValue.Simple;
      return <span>{dispNum(value)} {multiply} {stats('atk')}</span>;
    }
    case SkillValueKind.xRCV: {
      const { value } = _value as SkillValue.Simple;
      return <span>{dispNum(value)} {multiply} {stats('rcv')}</span>;
    }
    case SkillValueKind.xTeamRCV: {
      const { value } = _value as SkillValue.Simple;
      return <span>{dispNum(value)} {multiply} {stats('teamrcv')}</span>;
    }
    case SkillValueKind.xTeamATK: {
      const { value, attrs } = _value as SkillValue.WithAttributes;
      return <span>{dispNum(value)} {multiply} {renderAttribute(attrs)} {stats('teamatk')}</span>;
    }
    case SkillValueKind.HPScale: {
      const { min, max, scale } = _value as SkillValue.Scale;
      return <span>{dispNum(min)}{arrowDouble}{dispNum(max)} &prop; {stats('hp')} {multiply} {stats('atk')}</span>;
    }
    case SkillValueKind.RandomATK: {
      const { min, max, scale } = _value as SkillValue.Scale;
      if (min === max) {
        return <span>{dispNum(min)} {multiply} {stats('atk')}</span>;
      } else {
        return <span>random {multiply} {dispNum(min)}{arrowDouble}{dispNum(max)} {multiply} {stats('atk')}</span>;
      }
    }
    case SkillValueKind.xAwoken: {
      const { value, awokens } = _value as SkillValue.WithAwokens;
      return <span>{dispNum(value * 100)}% {multiply} each of awokens [{awokens.join()}]</span>;
    }
    default:
      return <span title={JSON.stringify(_value, null, 4)}>[ unknown value ]</span>;
  }
}

function renderCondition(cond: SkillCondition) {
  if (cond.hp) {
    if (cond.hp.min === cond.hp.max)
      return <Fragment key='cond'>{stats('hp')} = {dispNum(cond.hp.min * 100)}%</Fragment>;
    else if (cond.hp.min === 0)
      return <Fragment key='cond'>{stats('hp')} &le; {dispNum(cond.hp.max * 100)}%</Fragment>;
    else if (cond.hp.max === 1)
      return <Fragment key='cond'>{stats('hp')} &ge; {dispNum(cond.hp.min * 100)}%</Fragment>;
    else
      return <Fragment key='cond'>{stats('hp')} &#8712; [{dispNum(cond.hp.min * 100)}%, {dispNum(cond.hp.max * 100)}%]</Fragment>;
  } else if (cond.useSkill) {
    return <Fragment key='cond'>use skill</Fragment>;
  } else if (cond.multiplayer) {
    return <Fragment key='cond'>in multiplayer</Fragment>;
  } else if (cond.remainOrbs) {
    return <Fragment key='cond'>&le; {cond.remainOrbs.count} orbs remain</Fragment>;
  } else if (cond.exact) {
    if (cond.exact.type === 'combo') {
      return <Fragment key='cond'>= {cond.exact.value} combos</Fragment>;
    } else if (cond.exact.type === 'match-length') {
      return <Fragment key='cond'>= {cond.exact.value} {cond.exact.attrs === 'enhanced' ? 'Enhanced' : renderAttribute(cond.exact.attrs)} orbs</Fragment>;
    }
  } else if (cond.compo) {
    return <Fragment key='cond'>{cond.compo.type} [{cond.compo.ids.join()}] in team</Fragment>;
  } else {
    return <span key='cond' title={JSON.stringify(cond, null, 4)}>[ unknown condition ]</span>;
  }
}

function renderPowerUp(powerUp: SkillPowerUp) {
  function renderStats(hp: number, atk: number, rcv: number, mul = true) {
    const list = [['hp', hp], ['atk', atk], ['rcv', rcv]]
      .filter(([, value]) => value !== (mul ? 1 : 0));
    if (list.length === 0) return null;

    if (list.every(([, value]) => value === list[0][1])) {
      return <Fragment>{join(list.map(([name,]) => stats(name as any)))} {mul ? multiply : plus}{dispNum(list[0][1] as number)}</Fragment>;
    } else {
      return join(list.map(([name, value], i) => <Fragment key={i}>
        {stats(name as any)} {mul ? multiply : plus}{dispNum(value as number)}
      </Fragment>, <span className={css.spacer}>;</span>));
    }
  }

  switch (powerUp.kind) {
    case SkillPowerUpKind.Multiplier: {
      const { hp, atk, rcv } = powerUp as SkillPowerUp.Mul;
      return renderStats(hp, atk, rcv);
    }
    case SkillPowerUpKind.ScaleAttributes: {
      const { attrs, min, max, baseAtk, baseRcv, bonusAtk, bonusRcv } = powerUp as SkillPowerUp.ScaleAttrs;
      return <Fragment>
        &ge; {min} of [{renderAttribute(attrs)}] {arrow}
        {renderStats(1, baseAtk, baseRcv)}
        {max !== min && <Fragment>
          &nbsp;for each &le; {max} attributes: {renderStats(0, bonusAtk, bonusRcv, false)}
        </Fragment>}
      </Fragment>;
    }
    case SkillPowerUpKind.ScaleCombos: {
      const { min, max, baseAtk, baseRcv, bonusAtk, bonusRcv } = powerUp as SkillPowerUp.Scale;
      return <Fragment>
        &ge; {min} combos {arrow} {renderStats(1, baseAtk, baseRcv)}
        {max !== min && <Fragment>
          <span className={css.spacer}> </span>
          &nbsp;for each &le; {max} combos: {renderStats(0, bonusAtk, bonusRcv, false)}
        </Fragment>}
      </Fragment>;
    }
    case SkillPowerUpKind.ScaleMatchAttrs: {
      const { attrs, min, max, baseAtk, baseRcv, bonusAtk, bonusRcv } = powerUp as SkillPowerUp.ScaleMultiAttrs;
      return <Fragment>
        &ge; {min} combos of [{join(attrs.map(attrs => renderAttribute(attrs, ' ')))}] {arrow}
        {renderStats(1, baseAtk, baseRcv)}
        {max !== min && <Fragment>
          &nbsp;for each &le; {max} combos: {renderStats(0, bonusAtk, bonusRcv, false)}
        </Fragment>}
      </Fragment>;
    }
    case SkillPowerUpKind.ScaleMatchLength: {
      const { attrs, min, max, baseAtk, baseRcv, bonusAtk, bonusRcv } = powerUp as SkillPowerUp.ScaleAttrs;
      return <Fragment>
        &ge; {min} {multiply} [{renderAttribute(attrs)}] {arrow}
        {renderStats(1, baseAtk, baseRcv)}
        {max !== min && <Fragment>
          &nbsp;for each &le; {max} orbs: {renderStats(0, bonusAtk, bonusRcv, false)}
        </Fragment>}
      </Fragment>;
    }
    case SkillPowerUpKind.ScaleCross: {
      const { crosses } = powerUp as SkillPowerUp.ScaleCross;
      return join(crosses.map(({ single, attr, mul }, i) => <Fragment key={i}>
        {mul !== 1 && <Fragment>{stats('atk')} {multiply} {dispNum(mul)} </Fragment>}
        {single ? 'when' : 'for each'} cross of {renderAttribute(attr)}
      </Fragment>));
    }
    case SkillPowerUpKind.ScaleAwoken: {
      const { awokens, value } = powerUp as SkillPowerUp.ScaleAwokens;
      return <Fragment>
        {stats('atk')} {multiply} {dispNum(value - 1)} for each awoken [{awokens.join()}]
      </Fragment>;
    }
    default:
      return <span title={JSON.stringify(powerUp, null, 4)}>[ unknown power up ]</span>;
  }
}

function renderSimple(skill: Skill) {
  switch (skill.kind) {
    case SkillKinds.ActiveTurns: {
      const { turns, skill: actionSkill } = skill as Skill.ActiveTurns;
      return <Fragment>
        <span className={css.turns}>For {turns} turns: </span>
        {renderSkill(actionSkill)}
      </Fragment>;
    }
    case SkillKinds.RandomSkills: {
      const { skills } = skill as Skill.RandomSkills;
      return <Fragment>
        <span className={css.kind}>Random skills </span>
        <ul>
          {skills.map((skill, i) => <li className={css.skill} key={i}>{renderSkill(skill)}</li>)}
        </ul>
      </Fragment>;
    }
    case SkillKinds.Heal: {
      const { value } = skill as Skill.WithValue;
      return <Fragment>
        <span className={css.kind}>Heal </span>
        {renderValue(value)}
      </Fragment>;
    }
    case SkillKinds.DefenseBreak: {
      const { value } = skill as Skill.WithValue;
      return <Fragment>
        <span className={css.kind}>Defense Break </span>
        {renderValue(value)}
      </Fragment>;
    }
    case SkillKinds.Poison: {
      const { value } = skill as Skill.WithValue;
      return <Fragment>
        <span className={css.kind}>Poison </span>
        {renderValue(value)}
      </Fragment>;
    }
    case SkillKinds.TimeExtend: {
      const { value } = skill as Skill.WithValue;
      return <Fragment>
        <span className={css.kind}>Time Extend </span>
        {renderValue(value, 'seconds')}
      </Fragment>;
    }
    case SkillKinds.AutoAttack: {
      const { value } = skill as Skill.WithValue;
      return <Fragment>
        <span className={css.kind}>Auto-Attack </span>
        {renderValue(value)}
      </Fragment>;
    }
    case SkillKinds.AutoHeal: {
      const { value } = skill as Skill.WithValue;
      return <Fragment>
        <span className={css.kind}>Auto-Heal </span>
        {renderValue(value)}
      </Fragment>;
    }
    case SkillKinds.CTW: {
      const { value } = skill as Skill.WithValue;
      return <Fragment>
        <span className={css.kind}>CTW </span>
        {renderValue(value, 'seconds')}
      </Fragment>;
    }
    case SkillKinds.Gravity: {
      const { value } = skill as Skill.WithValue;
      return <Fragment>
        <span className={css.kind}>Gravity </span>
        {renderValue(value)}
      </Fragment>;
    }
    case SkillKinds.Resolve: {
      const { min, max } = skill as Skill.Resolve;
      return <Fragment>
        <span className={css.kind}>Resolve </span>
        {renderValue(min)} {arrowDouble} {renderValue(max)}
      </Fragment>;
    }
    case SkillKinds.BoardChange: {
      const { attrs } = skill as Skill.BoardChange;
      return <Fragment>
        <span className={css.kind}>Board Change </span>
        {renderAttribute(attrs)}
      </Fragment>;
    }
    case SkillKinds.SkillBoost: {
      const { value } = skill as Skill.WithValue<number>;
      return <Fragment>
        <span className={css.kind}>Skill boost </span>
        {value} turns
      </Fragment>;
    }
    case SkillKinds.AddCombo: {
      const { value } = skill as Skill.WithValue<number>;
      return <Fragment>
        <span className={css.kind}>Add combo </span>
        {value} combos
      </Fragment>;
    }
    case SkillKinds.MinMatchLength: {
      const { value } = skill as Skill.WithValue<number>;
      return <Fragment>
        <span className={css.kind}>Minimum Match Length </span>
        {value} orbs
      </Fragment>;
    }
    case SkillKinds.FixedTime: {
      const { value } = skill as Skill.WithValue<number>;
      return <Fragment>
        <span className={css.kind}>Fixed movement time </span>
        {value} seconds
      </Fragment>;
    }
    case SkillKinds.DropRefresh:
      return <span className={css.kind}>Drop Refresh</span>;
    case SkillKinds.Delay:
      return <span className={css.kind}>Delay</span>;
    case SkillKinds.Drum:
      return <span className={css.kind}>Drum sound</span>;
    case SkillKinds.MassAttack:
      return <span className={css.kind}>Mass Attack</span>;
    case SkillKinds.LeaderChange:
      return <span className={css.kind}>Leader Change</span>;
    case SkillKinds.NoSkyfall:
      return <span className={css.kind}>No Skyfall</span>;
    case SkillKinds.Board7x6:
      return <span className={css.kind}>7x6 Board</span>;
  }
  return null;
}

function renderComplex(_skill: Skill) {
  switch (_skill.kind) {
    case SkillKinds.DamageEnemy: {
      const skill = _skill as Skill.DamageEnemy;
      let attr, target;
      switch (skill.attr) {
        case 'self': break;
        case 'fixed': attr = <Fragment> <span className={[css.attr, css['attr-fixed']].join(' ')}>Fixed</span></Fragment>; break;
        default: attr = <Fragment> {renderAttribute(skill.attr)}</Fragment>; break;
      }
      switch (skill.target) {
        case 'all': target = 'All enemies'; break;
        case 'single': target = 'Single enemy'; break;
        default: target = <Fragment>{renderAttribute(skill.target)} enemies</Fragment>; break;
      }
      return <Fragment>
        <span className={css.kind}>Inflict damage </span>
        {!!skill.selfHP && <Fragment>HP = {renderValue(skill.selfHP)} {arrow} </Fragment>}
        {renderValue(skill.damage)}{attr} {arrow} {target}
      </Fragment>;
    }
    case SkillKinds.Vampire: {
      const skill = _skill as Skill.Vampire;
      let attr;
      if (skill.attr !== 'self') {
        attr = <Fragment> {renderAttribute(skill.attr)}</Fragment>;
      }

      return <Fragment>
        <span className={css.kind}>Vampire </span>
        {renderValue(skill.damage)}{attr} {arrow} {renderValue(skill.heal)}
      </Fragment>;
    }
    case SkillKinds.CounterAttack: {
      const skill = _skill as Skill.CounterAttack;
      let attr;
      if (skill.attr !== 'self') {
        attr = <Fragment> {renderAttribute(skill.attr)}</Fragment>;
      }

      return <Fragment>
        <span className={css.kind}>Counter attack </span>
        {renderValue(skill.prob)} {arrow} {renderValue(skill.value)}{attr}
      </Fragment>;
    }
    case SkillKinds.ChangeOrbs: {
      return <Fragment>
        <span className={css.kind}>Orb change </span>
        {join((_skill as Skill.ChangeOrbs).changes.map((change, i) => {
          switch (change.kind) {
            case 'from':
              return <Fragment key={i}>
                {renderAttribute(change.from)} {arrow} {renderAttribute(change.to)}
              </Fragment>;
            case 'gen':
              return <Fragment key={i}>
                {cross} {renderAttribute(change.exclude)} {arrow} {change.count} {multiply} {renderAttribute(change.to)}
              </Fragment>;
            case 'fixed':
              return change.positions.length > 0 && <Fragment key={i}>
                {change.type} {change.positions.map(p => p + 1).join()} {arrow} {renderAttribute(change.to)}
              </Fragment>;
          }
        }), <span className={css.spacer} key='spacer'> </span>)}
      </Fragment>;
    }
    case SkillKinds.PowerUp: {
      const { attrs, types, condition, value, reduceDamage } = _skill as Skill.PowerUp;
      const conditions = join(
        [...renderAttribute(attrs || [], null),
        ...renderTypes(types || [], null),
        ...(condition ? [renderCondition(condition)] : [])
        ]);
      return <Fragment>
        <span className={css.kind}>Power Up </span>
        {conditions} {!!conditions.length && arrow} {renderPowerUp(value)}
        {!!reduceDamage && <Fragment> {shield} {renderValue(reduceDamage)}</Fragment>}
      </Fragment>;
    }
    case SkillKinds.ReduceDamage: {
      const { attrs, percent, condition } = _skill as Skill.ReduceDamage;
      let attr;
      switch (attrs) {
        case 'all': attr = null; break;
        default: attr = <Fragment>{renderAttribute(attrs)} </Fragment>; break;
      }

      return <Fragment>
        <span className={css.kind}>Reduce damage </span>
        {!!condition && <Fragment>{renderCondition(condition)} {arrow} </Fragment>}
        {attr}{shield} {renderValue(percent)}
      </Fragment>;
    }
    case SkillKinds.Unbind: {
      const { normal, awoken } = _skill as Skill.Unbind;
      let a, b;
      if (normal) a = <Fragment key='normal'>{normal} turns</Fragment>;
      if (awoken) b = <Fragment key='awoken'>{awoken} turns awoken bind</Fragment>;

      return <Fragment>
        <span className={css.kind}>Unbind </span>
        {join([a, b])}
      </Fragment>;
    }
    case SkillKinds.OrbDropIncrease: {
      const skill = _skill as Skill.OrbDropIncrease;
      let attrs;
      if (skill.attrs === 'enhanced') {
        attrs = <span className={[css.attr, css['attr-enhanced']].join(' ')}>Enhanced</span>;
      } else {
        attrs = renderAttribute(skill.attrs);
      }

      return <Fragment>
        <span className={css.kind}>Orb drop </span>
        {attrs} {arrowUp}{renderValue(skill.value)}
      </Fragment>;
    }
    case SkillKinds.VoidEnemyBuff: {
      const skill = _skill as Skill.VoidEnemyBuff;
      return <Fragment>
        <span className={css.kind}>Void buffs </span>
        {skill.buffs.map(buff => <span className={css.status} key={buff}>{
          {
            'attr-absorb': 'Attribute damage absorb',
            'damage-absorb': 'Damage absorb',
          }[buff]
        }</span>)}
      </Fragment>;
    }
    case SkillKinds.ChangeAttribute: {
      const skill = _skill as Skill.ChangeAttribute;
      let target;
      switch (skill.target) {
        case 'self': target = 'Self'; break;
        case 'opponent': target = 'Enemy'; break;
      }

      return <Fragment>
        <span className={css.kind}>Change attribute </span>
        {target} {arrow} {renderAttribute(skill.attr)}
      </Fragment>;
    }
    case SkillKinds.SetOrbState: {
      const skill = _skill as Skill.SetOrbState;
      let attrs, state;
      if (!skill.orbs) {
        attrs = <Fragment>All orbs</Fragment>;
      } else {
        attrs = renderAttribute(skill.orbs);
      }
      switch (skill.state) {
        case 'enhanced': state = 'Enhanced'; break;
        case 'locked': state = 'Locked'; break;
        case 'unlocked': state = 'Unlocked'; break;
      }

      return <Fragment>
        <span className={css.kind}>Set orbs </span>
        {attrs} {arrow} {state}
      </Fragment>;
    }
    case SkillKinds.RateMultiply: {
      const skill = _skill as Skill.RateMultiply;
      let rate;
      switch (skill.rate) {
        case 'drop': rate = 'Drop rate'; break;
        case 'coin': rate = 'Coins'; break;
        case 'exp': rate = 'EXP'; break;
      }

      return <Fragment>
        <span className={css.kind}>Rate multiply </span>
        <span>{rate} {multiply} {renderValue(skill.value)}</span>
      </Fragment>;
    }
  }
  return null;
}

function renderSkill(skill: Skill) {
  const result: JSX.Element =
    renderSimple(skill) ||
    renderComplex(skill) ||
    <Fragment>unknown skill kind: {skill.kind}</Fragment>;

  return <span className={[css.item, css[`kind-${skill.kind}`]].join(' ')}>{result}</span>;
}

export function renderSkills(skills: Skill[]) {
  return <div title={JSON.stringify(skills, null, 4)}>{
    skills.map((skill, i) => <div className={css.skill} key={i}>{renderSkill(skill)}</div>)
  }</div>;
}