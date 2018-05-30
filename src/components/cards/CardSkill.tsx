import { Icon, Typography } from '@material-ui/core';
import { isEqual } from 'lodash';
import { computed } from 'mobx';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { Asset, AssetBox, HoverPopup } from 'src/components/base';
import { Expander } from 'src/components/base/Expander';
import { Attributes, Types } from 'src/models';
import {
  Skill, SkillCondition, SkillKinds, SkillPowerUp,
  SkillPowerUpKind, SkillValue, SkillValueKind
} from 'src/models/ParsedSkill';
import { parse } from 'src/parsers/CardSkillParser';
import { render as renderText } from 'src/renderer/TextRenderer';
import { Store } from 'src/store';
import { store } from 'src/utils';
import './CardSkill.css';

export interface CardSkillProps {
  id: number;
}

@inject('store')
@observer
export class CardSkill extends React.Component<CardSkillProps> {
  @store
  private readonly store: Store;

  @computed
  private get id() { return this.props.id || 0; }

  @computed
  private get skill() { return this.store.gameData.skills.find(skill => skill.id === this.id)!; }

  @computed
  private get parsedSkills() { return parse(this.store.gameData.skills, this.id); }

  public render() {
    const skill = this.skill;
    if (!skill) return null;

    return (
      <div className="CardSkill-root">
        <div className="CardSkill-header">
          <Typography variant="title">{skill.name}</Typography>
          <div className="CardSkill-spacer" />

          {(skill.maxLevel || undefined) && <Typography variant="body2" className="CardSkill-header-item">
            max level: {skill.maxLevel}
          </Typography>}

          {(skill.initialCooldown || undefined) && <Typography variant="body2" className="CardSkill-header-item">
            cooldown: {skill.initialCooldown} (min. {skill.initialCooldown - skill.maxLevel + 1})
          </Typography>}
        </div>
        <p>{renderText(skill.description)}</p>
        <Expander header="Skill Data">
          <div className="CardSkill-data">
            <div className="CardSkill-skill-list">{this.parsedSkills.map(renderSkillEntry)}</div>
            <HoverPopup className="CardSkill-raw-icon" anchor="left" header={<Icon>code</Icon>}>
              <div className="CardSkill-raw-data">{JSON.stringify(this.parsedSkills, null, 4)}</div>
            </HoverPopup>
          </div>
        </Expander>
      </ div>
    );
  }
}


function renderSkillEntry(skill: Skill, key: number) {
  return <div className="CardSkill-skill-entry" key={key}>{renderSkill(skill)}</div>;
}

function renderSkill(skill: Skill): React.ReactNode {
  switch (skill.kind) {
    case SkillKinds.Unknown: {
      return <span className="CardSkill-skill">unknown skill</span>;
    }
    case SkillKinds.ActiveTurns: {
      const { turns, skill: actionSkill } = skill as Skill.ActiveTurns;
      return <span className="CardSkill-skill">{renderSkill(actionSkill)} &times; {turns} turns</span>;
    }
    case SkillKinds.RandomSkills: {
      const { skills } = skill as Skill.RandomSkills;
      return (
        <>
          <span className="CardSkill-skill">random skills:</span>
          <ul className="CardSkill-item-list">
            {skills.map((data, i) => <li key={i}>
              <div className="CardSkill-skill-list">{data.map(renderSkillEntry)}</div>
            </li>)}
          </ul>
        </>
      );
    }

    case SkillKinds.Delay: {
      return (
        <span className="CardSkill-skill">
          <Asset assetId="status-delay" className="CardSkill-icon" title="Delay" />
        </span>
      );
    }
    case SkillKinds.MassAttack: {
      return (
        <span className="CardSkill-skill">
          <Asset assetId="status-mass-attack" className="CardSkill-icon" title="Mass attack" />
        </span>
      );
    }
    case SkillKinds.LeaderChange: {
      return (
        <span className="CardSkill-skill">
          <Asset assetId="status-leader-change" className="CardSkill-icon" title="Leader change" />
        </span>
      );
    }
    case SkillKinds.NoSkyfall: {
      return (
        <span className="CardSkill-skill">
          <Asset assetId="status-no-skyfall" className="CardSkill-icon" title="No skyfall" />
        </span>
      );
    }
    case SkillKinds.Heal: {
      const { value } = skill as Skill.WithValue;
      return (
        <span className="CardSkill-skill">
          <Asset assetId="status-heal" className="CardSkill-icon" title="Heal" />
          {renderValue(value)}
        </span>
      );
    }
    case SkillKinds.DefenseBreak: {
      const { value } = skill as Skill.WithValue;
      return (
        <span className="CardSkill-skill">
          <Asset assetId="status-def-break" className="CardSkill-icon" title="Defense break" />
          {renderValue(value)}
        </span>
      );
    }
    case SkillKinds.Poison: {
      const { value } = skill as Skill.WithValue;
      return (
        <span className="CardSkill-skill">
          <Asset assetId="status-poison" className="CardSkill-icon" title="Poison" />
          {renderValue(value)}
        </span>
      );
    }
    case SkillKinds.TimeExtend: {
      const { value } = skill as Skill.WithValue;
      return (
        <span className="CardSkill-skill">
          <Asset assetId={SkillValue.isLess(value) ? 'status-time-decr' : 'status-time-incr'}
            className="CardSkill-icon"
            title={SkillValue.isLess(value) ? 'Time decrease' : 'Time extend'}
          />
          {renderValue(value, 'seconds')}
        </span>
      );
    }
    case SkillKinds.FollowAttack: {
      const { value } = skill as Skill.WithValue;
      return (
        <span className="CardSkill-skill">
          <Asset assetId="skill-follow-atk" className="CardSkill-icon" title="Follow-up Attack" />
          {renderValue(value)}
        </span>
      );
    }
    case SkillKinds.AutoHeal: {
      const { value } = skill as Skill.WithValue;
      return (
        <span className="CardSkill-skill">
          <Asset assetId="status-heal" className="CardSkill-icon" title="Auto-heal" />
          {renderValue(value)}
        </span>
      );
    }
    case SkillKinds.CTW: {
      const { value } = skill as Skill.WithValue;
      return (
        <span className="CardSkill-skill">
          <AssetBox className="CardSkill-icon-box" title="CTW">
            <Asset assetId="status-combo" className="CardSkill-icon" />
            <Asset assetId="status-time-incr" className="CardSkill-icon" style={{ transform: 'scale(0.75)' }} />
          </AssetBox>
          {renderValue(value, 'seconds')}
        </span>
      );
    }
    case SkillKinds.Gravity: {
      const { value } = skill as Skill.WithValue;
      return (
        <span className="CardSkill-skill">
          <Asset assetId="skill-gravity" className="CardSkill-icon" title="Gravity" />
          {renderValue(value)}
        </span>
      );
    }
    case SkillKinds.Resolve: {
      const { min, max } = skill as Skill.Resolve;
      return (
        <span className="CardSkill-skill">
          <Asset assetId="status-resolve" className="CardSkill-icon" title="Resolve" />
          {renderValue(min)} &hArr; {renderValue(max)}
        </span>
      );
    }
    case SkillKinds.BoardChange: {
      const { attrs } = skill as Skill.BoardChange;
      return (
        <span className="CardSkill-skill">
          <AssetBox className="CardSkill-icon-box" title="Board change">
            <Asset assetId="status-combo" className="CardSkill-icon" />
            <Asset assetId="overlay-drop" className="CardSkill-icon" />
          </AssetBox>
          {renderOrbs(attrs)}
        </span>
      );
    }
    case SkillKinds.SkillBoost: {
      const { value } = skill as Skill.WithValue<number>;
      return (
        <span className="CardSkill-skill">
          <Asset assetId="skill-boost" className="CardSkill-icon" title="Skill boost" />
          {value} turns
        </span>
      );
    }
    case SkillKinds.AddCombo: {
      const { value } = skill as Skill.WithValue<number>;
      return (
        <span className="CardSkill-skill">
          <Asset assetId={`status-combo-p${value}`} className="CardSkill-icon" title={`Add ${value} combo`} />
        </span>
      );
    }
    case SkillKinds.FixedTime: {
      const { value } = skill as Skill.WithValue<number>;
      return (
        <span className="CardSkill-skill">
          <AssetBox className="CardSkill-icon-box" title="Fixed movement time">
            <Asset assetId="status-time-incr" className="CardSkill-icon" />
            <Asset assetId="orb-locked" className="CardSkill-icon" />
          </AssetBox>
          {value} seconds
        </span>
      );
    }
    case SkillKinds.MinMatchLength: {
      const { value } = skill as Skill.WithValue<number>;
      return <span className="CardSkill-skill">minimum match length {value}</span>;
    }
    case SkillKinds.DropRefresh: {
      return <span className="CardSkill-skill">drop refresh</span>;
    }
    case SkillKinds.Drum: {
      return <span className="CardSkill-skill">drum sound</span>;
    }
    case SkillKinds.Board7x6: {
      return <span className="CardSkill-skill">7x6 board</span>;
    }

    case SkillKinds.DamageEnemy: {
      const { attr, target, selfHP, damage } = skill as Skill.DamageEnemy;
      return (
        <span className="CardSkill-skill">
          {!!selfHP && <>HP = {renderValue(selfHP)} &rArr;</>}

          <Asset assetId="skill-attack" className="CardSkill-icon" />

          {target === 'all' && <Asset assetId="status-mass-attack" className="CardSkill-icon" title="All enemies" />}
          {target === 'single' && <>single enemy </>}
          {typeof target === 'number' && <>{renderAttrs(target)} enemies </>}

          &rArr; {renderValue(damage)}
          {attr === 'fixed' && <Asset assetId="status-def-break" className="CardSkill-icon" title="Fixed damage" />}
          {typeof attr === 'number' && renderAttrs(attr)}

        </span>
      );
    }
    case SkillKinds.Vampire: {
      const { attr, damage, heal } = skill as Skill.Vampire;
      return (
        <span className="CardSkill-skill">
          <Asset assetId="skill-attack" className="CardSkill-icon" />
          single enemy &rArr; {renderValue(damage)}
          {typeof attr === 'number' && renderAttrs(attr)}
          &nbsp;&rArr;
          <Asset assetId="status-heal" className="CardSkill-icon" />
          {renderValue(heal)} damage
        </span>
      );
    }
    case SkillKinds.CounterAttack: {
      const { attr, prob, value } = skill as Skill.CounterAttack;
      return (
        <span className="CardSkill-skill">
          <Asset assetId="status-counter" className="CardSkill-icon" />
          {renderValue(prob)} &rArr; {renderValue(value)} damage
          {typeof attr === 'number' && renderAttrs(attr)}
        </span>
      );
    }
    case SkillKinds.ChangeOrbs: {
      const { changes } = skill as Skill.ChangeOrbs;
      return (
        <span className="CardSkill-skill">
          <AssetBox className="CardSkill-icon-box" title="Change orbs">
            <Asset assetId="status-all-attrs" className="CardSkill-icon" />
            <Asset assetId="overlay-heal" className="CardSkill-icon" />
          </AssetBox>
          <span className="CardSkill-item-list">
            {changes.map((change, i) => {
              switch (change.kind) {
                case 'from':
                  return (
                    <span key={i}>
                      {renderOrbs(change.from)} &rArr; {renderOrbs(change.to)}
                    </span>
                  );
                case 'gen':
                  return (
                    <span key={i}>
                      {renderOrbs(change.exclude).map((orb, j) => (
                        <AssetBox className="CardSkill-icon-box" key={j}>
                          {orb}
                          <Asset assetId="overlay-cross" className="CardSkill-icon" />
                        </AssetBox>
                      ))} &rArr; {renderOrbs(change.to)} &times; {change.count}
                    </span>
                  );
                case 'fixed':
                  return (change.positions.length > 0 &&
                    <span key={i}>
                      {change.type === 'col' ? 'column' : 'row'}&nbsp;
                    {change.positions.map(p => p + 1).join(', ')}
                      &nbsp;&rArr; {renderOrbs(change.to)}
                    </span>
                  );
              }
            })}
          </span>
        </span>
      );
    }
    case SkillKinds.Unbind: {
      const { normal, awakenings } = skill as Skill.Unbind;
      return (
        <span className="CardSkill-skill CardSkill-item-list">
          {!!normal && <span>
            <Asset assetId="skill-unbind" className="CardSkill-icon" />
            {normal} turns
          </span>}
          {!!awakenings && <span>
            <AssetBox className="CardSkill-icon-box">
              <Asset assetId="status-bind-awakenings" className="CardSkill-icon" />
              <Asset assetId="overlay-heal" className="CardSkill-icon" />
            </AssetBox>
            {awakenings} turns
          </span>}
        </span>
      );
    }
    case SkillKinds.OrbDropIncrease: {
      const { attrs, value } = skill as Skill.OrbDropIncrease;
      let attrElems: React.ReactNode[];
      if (attrs === 'enhanced')
        attrElems = [<Asset assetId="status-orb-enhanced" className="CardSkill-icon" key="enhanced" />];
      else
        attrElems = renderOrbs(attrs);

      attrElems = attrElems.map((elem, i) => (
        <AssetBox className="CardSkill-icon-box" key={i}>
          {elem}
          <Asset assetId="overlay-drop" className="CardSkill-icon" />
        </AssetBox>
      ));

      return (
        <span className="CardSkill-skill">
          {attrElems}
          {renderValue(value)}
        </span>
      );
    }
    case SkillKinds.VoidEnemyBuff: {
      const { buffs } = skill as Skill.VoidEnemyBuff;
      return (
        <span className="CardSkill-skill">{
          buffs.map(buff => {
            switch (buff) {
              case 'attr-absorb': return (
                <AssetBox className="CardSkill-icon-box" key={buff}>
                  <Asset assetId="status-all-attrs" className="CardSkill-icon" />
                  <Asset assetId="overlay-heal" className="CardSkill-icon" />
                  <Asset assetId="overlay-cross" className="CardSkill-icon" style={{ opacity: 0.75 }} />
                </AssetBox>
              );
              case 'damage-absorb': return (
                <AssetBox className="CardSkill-icon-box" key={buff}>
                  <Asset assetId="status-damage-absorb" className="CardSkill-icon" />
                  <Asset assetId="overlay-cross" className="CardSkill-icon" style={{ opacity: 0.75 }} />
                </AssetBox>
              );
            }
          })
        } </span>
      );
    }
    case SkillKinds.ChangeAttribute: {
      const { attr, target } = skill as Skill.ChangeAttribute;

      return (
        <span className="CardSkill-skill">
          {target === 'self' && 'Self'}
          {target === 'opponent' && 'enemy'}
          &nbsp;&rArr; {renderAttrs(attr)}
        </span>
      );
    }
    case SkillKinds.SetOrbState: {
      const { orbs, state } = skill as Skill.SetOrbState;
      let orbElems: React.ReactNode[];
      if (!orbs) {
        orbElems = [<Asset assetId="orb-blind" className="CardSkill-icon" key="all" />];
      } else {
        orbElems = renderOrbs(orbs);
      }

      return (
        <span className="CardSkill-skill">
          {(state === 'enhanced' || state === 'locked') && orbElems}
          {state === 'unlocked' && orbElems.map((elem, i) => (
            <AssetBox className="CardSkill-icon-box" key={i}>
              {elem}
              <Asset assetId="orb-locked" className="CardSkill-icon" />
            </AssetBox>
          ))}
          &rArr;
          {state === 'enhanced' && orbElems.map((elem, i) => (
            <AssetBox className="CardSkill-icon-box" key={i}>
              {elem}
              <Asset assetId="orb-enhanced" className="CardSkill-icon" />
            </AssetBox>
          ))}
          {state === 'locked' && orbElems.map((elem, i) => (
            <AssetBox className="CardSkill-icon-box" key={i}>
              {elem}
              <Asset assetId="orb-locked" className="CardSkill-icon" />
            </AssetBox>
          ))}
          {state === 'unlocked' && orbElems}
        </span>
      );
    }
    case SkillKinds.RateMultiply: {
      const { rate, value } = skill as Skill.RateMultiply;

      return (
        <span className="CardSkill-skill">
          {rate === 'drop' && 'drop rate'}
          {rate === 'coin' && 'coins'}
          {rate === 'exp' && 'EXP'}
          &nbsp;&times;&nbsp;
          {renderValue(value)}
        </span>
      );
    }

    case SkillKinds.ReduceDamage: {
      const { attrs, percent, condition } = skill as Skill.ReduceDamage;

      return (
        <span className="CardSkill-skill">
          {!!condition && <>{renderCondition(condition)} &rArr; </>}
          <Asset assetId="status-def" className="CardSkill-icon" />
          {(Array.isArray(attrs) && !isEqual(attrs, Attributes.all())) && renderAttrs(attrs)}
          {renderValue(percent)}
        </span>
      );
    }
    case SkillKinds.PowerUp: {
      const { attrs, types, condition, value, reduceDamage } = skill as Skill.PowerUp;
      const targets: React.ReactNode[] = [];
      if (attrs && !isEqual(attrs, Attributes.all())) targets.push(...renderAttrs(attrs || []));
      if (types) targets.push(...renderTypes(types || []));

      return (
        <span className="CardSkill-skill">
          {condition && <>{renderCondition(condition)} &rArr; </>}
          {targets.length > 0 && <>{targets}</>}
          {!!value && renderPowerUp(value)}
          {!!reduceDamage && <>
            <Asset assetId="status-def" className="CardSkill-icon" />
            {renderValue(reduceDamage)}
          </>}
        </span>
      );
    }
  }

  return <span className="CardSkill-skill">{skill.kind}</span>;
}

function formatNumber(num: number) {
  return Number(num.toFixed(2)).toString();
}

function renderStat(stat: 'maxhp' | 'hp' | 'atk' | 'rcv' | 'teamatk' | 'teamrcv') {
  switch (stat) {
    case 'maxhp':
      return <span className="CardSkill-stats" key={stat}>Max HP</span>;
    case 'teamatk':
      return <span className="CardSkill-stats" key={stat}>Team ATK</span>;
    case 'teamrcv':
      return <span className="CardSkill-stats" key={stat}>Team RCV</span>;
    default:
      return <span className="CardSkill-stats" key={stat}>{stat.toUpperCase()}</span>;
  }
}

function renderAttrs(attrs: Attributes | Attributes[]) {
  if (!Array.isArray(attrs))
    attrs = [attrs];
  return attrs.map(attr => {
    if (attr >= Attributes.Heart)
      return <Asset assetId={`orb-${attr}`} key={attr} className="CardSkill-icon" />;
    return <Asset assetId={`attr-${attr}`} key={attr} className="CardSkill-icon" />;
  });
}

function renderOrbs(attrs: Attributes | Attributes[]) {
  if (!Array.isArray(attrs))
    attrs = [attrs];
  return attrs.map(attr => <Asset assetId={`orb-${attr}`} key={attr} className="CardSkill-icon" />);
}

function renderTypes(types: Types | Types[]) {
  if (!Array.isArray(types))
    types = [types];
  return types.map(type => <Asset assetId={`type-${type}`} key={type} className="CardSkill-icon" />);
}


function renderCondition(cond: SkillCondition) {
  if (cond.hp) {
    if (cond.hp.min === cond.hp.max)
      return <>{renderStat('hp')} = {formatNumber(cond.hp.min * 100)}%</>;
    else if (cond.hp.min === 0)
      return <>{renderStat('hp')} &le; {formatNumber(cond.hp.max * 100)}%</>;
    else if (cond.hp.max === 1)
      return <>{renderStat('hp')} &ge; {formatNumber(cond.hp.min * 100)}%</>;
    else
      return <>{renderStat('hp')} &in; [{formatNumber(cond.hp.min * 100)}%, {formatNumber(cond.hp.max * 100)}%]</>;
  } else if (cond.useSkill) {
    return <>use skill</>;
  } else if (cond.multiplayer) {
    return <>in multiplayer</>;
  } else if (cond.remainOrbs) {
    return <>&le; {cond.remainOrbs.count} orbs remain</>;
  } else if (cond.exact) {
    if (cond.exact.type === 'combo') {
      return <>= {cond.exact.value} combos</>;
    } else if (cond.exact.type === 'match-length') {
      return <>= {cond.exact.value} {cond.exact.attrs === 'enhanced' ? 'Enhanced' : renderAttrs(cond.exact.attrs)} orbs</>;
    }
  } else if (cond.compo) {
    return <>{cond.compo.type} [{cond.compo.ids.join()}] in team</>;
  }
  return <>[ unknown condition ]</>;
}

function renderPowerUp(powerUp: SkillPowerUp) {
  function renderStats(hp: number, atk: number, rcv: number, mul = true) {
    const operator = mul ? <>&times;</> : <>+</>;
    let list: Array<['hp' | 'atk' | 'rcv', number]> = [['hp', hp], ['atk', atk], ['rcv', rcv]];
    list = list.filter(([, value]) => value !== (mul ? 1 : 0));
    if (list.length === 0) return null;

    if (list.every(([, value]) => value === list[0][1])) {
      return <>
        {list.map(([name], i) => <React.Fragment key={name}>{i !== 0 && ', '}{renderStat(name)}</React.Fragment>)}
        &nbsp;{operator} {formatNumber(list[0][1])}
      </>;
    } else {
      return <>
        {list.map(([name, value], i) => (
          <React.Fragment key={name}>
            {i !== 0 ? '; ' : ''}
            {renderStat(name)}
            &nbsp;{operator} {formatNumber(value)}
          </React.Fragment>
        ))}
      </>;
    }
  }

  switch (powerUp.kind) {
    case SkillPowerUpKind.Multiplier: {
      const { hp, atk, rcv } = powerUp as SkillPowerUp.Mul;
      return renderStats(hp, atk, rcv);
    }
    case SkillPowerUpKind.ScaleAttributes: {
      const { attrs, min, max, baseAtk, baseRcv, bonusAtk, bonusRcv } = powerUp as SkillPowerUp.ScaleAttrs;
      return <>
        &ge; {min} of [{renderAttrs(attrs)}] &rArr; {renderStats(1, baseAtk, baseRcv)}
        {max !== min && <> for each &le; {max} attributes: {renderStats(0, bonusAtk, bonusRcv, false)}</>}
      </>;
    }
    case SkillPowerUpKind.ScaleCombos: {
      const { min, max, baseAtk, baseRcv, bonusAtk, bonusRcv } = powerUp as SkillPowerUp.Scale;
      return <>
        &ge; {min} combos &rArr; {renderStats(1, baseAtk, baseRcv)}
        {max !== min && <> for each &le; {max} combos: {renderStats(0, bonusAtk, bonusRcv, false)}</>}
      </>;
    }
    case SkillPowerUpKind.ScaleMatchAttrs: {
      const { matches, min, max, baseAtk, baseRcv, bonusAtk, bonusRcv } = powerUp as SkillPowerUp.ScaleMultiAttrs;
      return <>
        &ge; {min} matches of [{matches.map((attrs, i) =>
          <React.Fragment key={i}>{i !== 0 && ', '}{renderAttrs(attrs)}</React.Fragment>
        )}] &rArr; {renderStats(1, baseAtk, baseRcv)}
        {max !== min && <> for each &le; {max} matches: {renderStats(0, bonusAtk, bonusRcv, false)}</>}
      </>;
    }
    case SkillPowerUpKind.ScaleMatchLength: {
      const { attrs, min, max, baseAtk, baseRcv, bonusAtk, bonusRcv } = powerUp as SkillPowerUp.ScaleAttrs;
      return <>
        &ge; {min} &times; {renderAttrs(attrs)} &rArr; {renderStats(1, baseAtk, baseRcv)}
        {max !== min && <> for each &le; {max} orbs: {renderStats(0, bonusAtk, bonusRcv, false)}</>}
      </>;
    }
    case SkillPowerUpKind.ScaleCross: {
      const { crosses } = powerUp as SkillPowerUp.ScaleCross;
      return crosses.map(({ single, attr, mul }, i) => <React.Fragment key={i}>
        {i !== 0 && ', '}
        {mul !== 1 && <>{renderStat('atk')} &times; {formatNumber(mul)} </>}
        {single ? 'when' : 'for each'} cross of {renderAttrs(attr)}
      </React.Fragment>);
    }
    case SkillPowerUpKind.ScaleAwakenings: {
      const { awakenings, value } = powerUp as SkillPowerUp.ScaleAwakenings;
      return <>
        {renderStat('atk')} &times; {formatNumber(value - 1)} for each {awakenings.map(id =>
          <Asset assetId={`awakening-${id}`} className="CardSkill-icon" key={id} />
        )}
      </>;
    }
    default:
      return <>[ unknown power up ]</>;
  }
}

function renderValue(_value: SkillValue, unit?: string) {
  switch (_value.kind) {
    case SkillValueKind.Percent: {
      const { value } = _value as SkillValue.Simple;
      return <span>{formatNumber(value * 100)}%</span>;
    }
    case SkillValueKind.Constant: {
      const { value } = _value as SkillValue.Simple;
      return <span>{formatNumber(value)}{unit ? ` ${unit}` : ''}</span>;
    }
    case SkillValueKind.xMaxHP: {
      const { value } = _value as SkillValue.Simple;
      return <span>{formatNumber(value * 100)}% of {renderStat('maxhp')}</span>;
    }
    case SkillValueKind.xHP: {
      const { value } = _value as SkillValue.Simple;
      return <span>{formatNumber(value * 100)}% of {renderStat('hp')}</span>;
    }
    case SkillValueKind.xATK: {
      const { value } = _value as SkillValue.Simple;
      return <span>{formatNumber(value)} &times; {renderStat('atk')}</span>;
    }
    case SkillValueKind.xRCV: {
      const { value } = _value as SkillValue.Simple;
      return <span>{formatNumber(value)} &times; {renderStat('rcv')}</span>;
    }
    case SkillValueKind.xTeamRCV: {
      const { value } = _value as SkillValue.Simple;
      return <span>{formatNumber(value)} &times; {renderStat('teamrcv')}</span>;
    }
    case SkillValueKind.xTeamATK: {
      const { value, attrs } = _value as SkillValue.WithAttributes;
      return <span>{formatNumber(value)} &times; {renderAttrs(attrs)} {renderStat('teamatk')}</span>;
    }
    case SkillValueKind.HPScale: {
      const { min, max } = _value as SkillValue.Scale;
      return <span>({formatNumber(min)} &hArr; {formatNumber(max)} &prop; {renderStat('hp')}) &times; {renderStat('atk')}</span>;
    }
    case SkillValueKind.RandomATK: {
      const { min, max } = _value as SkillValue.Scale;
      if (min === max) {
        return <span>{formatNumber(min)} &times; {renderStat('atk')}</span>;
      } else {
        return <span>(random &times; {formatNumber(min)} &hArr; {formatNumber(max)}) &times; {renderStat('atk')}</span>;
      }
    }
    case SkillValueKind.xAwakenings: {
      const { value, awakenings } = _value as SkillValue.WithAwakenings;
      return <span>{formatNumber(value * 100)}% &times; each of {awakenings.map(id =>
        <Asset assetId={`awakening-${id}`} className="CardSkill-icon" key={id} />
      )}</span>;
    }
    default:
      return <span title={JSON.stringify(_value, null, 4)}>[ unknown value ]</span>;
  }
}