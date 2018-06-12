import { Icon, Typography } from '@material-ui/core';
import { isEqual, round, uniq } from 'lodash';
import { computed } from 'mobx';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { Asset, AssetBox, Popup } from 'src/components/base';
import { CardIcon } from 'src/components/cards/CardIcon';
import { Attributes, Curve, Types } from 'src/models';
import {
  BindTeamTarget, EnemySkill, EnemySkillKinds,
  OrbsLocation, OrbsLocationKind, SkillConditionKind, SkillValue
} from 'src/models/ParsedEnemySkill';
import { parse } from 'src/parsers/EnemySkillParser';
import { Store } from 'src/store';
import { store } from 'src/utils';
import './EnemySkills.css';

export interface EnemySkillsProps {
  id: number;
  level: number;
  showPlaceholder?: boolean;
}

@inject('store')
@observer
export class EnemySkills extends React.Component<EnemySkillsProps> {
  @store
  private readonly store: Store;

  @computed
  private get level() { return this.props.level || 1; }

  @computed
  private get id() { return this.props.id || 0; }

  @computed
  private get card() { return this.store.gameData.getCard(this.id)!; }

  public render() {
    if (!this.card) return null;

    const skills = this.card.enemy.skills
      .map(skill => parse(id => this.store.gameData.getEnemySkill(id), skill.id, skill.ai, skill.rnd));

    if (skills.length === 0 && this.props.showPlaceholder)
      return 'none';

    const data = {
      atk: Curve.valueAt(this.level, this.card.enemy.maxLevel, this.card.enemy.atk)
    };

    return (
      <ol className="EnemySkills-root">{
        skills.map((action, i) => <li className="EnemySkills-action-item" key={i}>
          <div className="EnemySkills-action-label">
            {i + 1}
            <Popup className="EnemySkills-raw-icon" anchor="right" header={<Icon>code</Icon>}>
              <div className="EnemySkills-raw-data">{JSON.stringify(action, null, 4)}</div>
            </Popup>
          </div>
          {renderActions(action, data)}
        </li>)
      }</ol>
    );
  }
}

interface EnemyData {
  atk: number;
}

function renderValue(value: SkillValue, isPercent = false) {
  let min: number | string = value.min;
  let max: number | string = value.max;
  let unit = '';
  if (isPercent) {
    min = round(min * 100, 2);
    max = round(max * 100, 2);
    unit = '%';
  }

  if (min === max) {
    return <span className="EnemySkills-value">{max}{unit}</span>;
  } else {
    return <span className="EnemySkills-value">{min}{unit} ~ {max}{unit}</span>;
  }
}

function renderDamage(value: SkillValue, data: EnemyData, times: SkillValue = { min: 1, max: 1 }) {
  const min = Math.floor(value.min * data.atk) * times.min;
  const max = Math.floor(value.max * data.atk) * times.max;
  return <span className="EnemySkills-damage">({min === max ? min : `${min} ~ ${max}`})</span>;
}

function renderAttrs(attrs: Attributes[]) {
  return attrs.map(attr => {
    if (attr >= Attributes.Heart)
      return <Asset assetId={`orb-${attr}`} key={attr} className="EnemySkills-icon" />;
    return <Asset assetId={`attr-${attr}`} key={attr} className="EnemySkills-icon" />;
  });
}

function renderOrbs(attrs: Attributes[]) {
  return attrs.map(attr => <Asset assetId={`orb-${attr}`} key={attr} className="EnemySkills-icon" />);
}

function renderTypes(types: Types[]) {
  return types.map(type => <Asset assetId={`type-${type}`} key={type} className="EnemySkills-icon" />);
}

function renderActions(action: EnemySkill | EnemySkill[], data: EnemyData): React.ReactNode {
  if (Array.isArray(action)) {
    if (action.length === 1)
      return renderActions(action[0], data);

    return (
      <ol className="EnemySkills-action-list">
        {action.map((skill, i) => <li key={i}>{renderActions(skill, data)}</li>)}
      </ol>
    );
  } else {
    return (
      <div className="EnemySkills-action">
        <Typography variant="caption" className="EnemySkills-action-header">{
          (
            action.conditions && action.conditions.map((cond) => {
              switch (cond.kind) {
                case SkillConditionKind.EnemyRemains: return `${cond.value} enemies remain`;
                case SkillConditionKind.AfterTurns: return `after ${cond.value} turns`;
                case SkillConditionKind.FlagSet: return `flag ${cond.value} is set`;
                case SkillConditionKind.FlagUnset: return `flag ${cond.value} is not set`;

                case SkillConditionKind.Preemptive: return 'preemptive action';
                case SkillConditionKind.OnDeath: return 'on death';

                case SkillConditionKind.HPLessThan: return `HP \u2264 ${round(cond.value * 100, 2)}%`;
                case SkillConditionKind.HPGreaterThan: return `HP \u2265 ${round(cond.value * 100, 2)}%`;

                case SkillConditionKind.CounterLessThan: return `counter \u2264 ${cond.value}`;
                case SkillConditionKind.CounterIs: return `counter = ${cond.value}`;
                case SkillConditionKind.CounterGreaterThan: return `counter \u2265 ${cond.value}`;

                case SkillConditionKind.LevelLessThan: return `level \u2264 ${cond.value}`;
                case SkillConditionKind.LevelIs: return `level = ${cond.value}`;
                case SkillConditionKind.LevelGreaterThan: return `level \u2265 ${cond.value}`;

                case SkillConditionKind.ComboGreaterThan: return `combo count last turn \u2265 ${cond.value}`;
              }
            }) || []
          ).concat(
            action.prob && action.prob !== 1 && `${round(action.prob * 100, 2)}% chance` || '',
            action.baseProb && `${round(action.baseProb * 100, 2)}% base chance` || ''
          ).filter(d => d.length > 0).join('; ')
        }</Typography>
        <div className="EnemySkills-action-header">
          {action.title && <Typography variant="subheading">{action.title}</Typography>}
          {action.message && <Typography variant="caption" style={{ whiteSpace: 'pre' }}>
            {action.message.replace('|', '\n')}
          </Typography>}
        </div>
        {renderSkill(action, data)}
      </div>
    );
  }
}

function renderLocation(loc: OrbsLocation) {
  switch (loc.kind) {
    case OrbsLocationKind.All:
      return <>all orbs</>;
    case OrbsLocationKind.Random: {
      const { count } = loc as OrbsLocation.Random;
      return <>{(count.min === 42 && count.max === 42) ? 'all' : renderValue(count)} orbs</>;
    }
    case OrbsLocationKind.Attributes: {
      const { count, attrs } = loc as OrbsLocation.Attrs;
      if (attrs)
        return <>{count && count !== 42 && `${count} `}{renderOrbs(attrs)} orbs</>;
      else
        return <>random {count} attribute orbs</>;
    }
    case OrbsLocationKind.Columns:
    case OrbsLocationKind.Rows: {
      const { ordinals } = loc as OrbsLocation.Axis;
      return <>{loc.kind === OrbsLocationKind.Columns ? 'column' : 'row'} {ordinals.map(i => i + 1).join(', ')}</>;
    }
    case OrbsLocationKind.Rectangle: {
      const { column, row, width, height } = loc as OrbsLocation.Rectangle;
      return <>rectangle (column={column}, row={row}, width={width}, height={height})</>;
    }
    case OrbsLocationKind.Specified: {
      const { positions } = loc as OrbsLocation.Specified;
      return (
        <span className="EnemySkills-board-marks">{
          positions.map((row, i) => <React.Fragment key={i}>
            {row.map(cell => cell ? '\u2B24' : '\u25EF').join('')}<br />
          </React.Fragment>)
        }</span>
      );
    }
  }
  return <>[unknown location]</>;
}

function renderSkill(action: EnemySkill, data: EnemyData): React.ReactNode {
  let children: React.ReactNode = action.kind;
  switch (action.kind) {
    case EnemySkillKinds.WithTurns: {
      const { turns, skill } = action as EnemySkill.WithTurns;
      children = <>{renderSkill(skill, data)} for {renderValue(turns)} turns</>;
      break;
    }
    case EnemySkillKinds.Sequence: {
      const { value } = action as EnemySkill.WithValue<EnemySkill[]>;
      children = <div className="EnemySkills-action-sequence">
        {renderActions(value, data)}
      </div>;
      break;
    }
    case EnemySkillKinds.Choose: {
      const { value } = action as EnemySkill.WithValue<EnemySkill[]>;
      children = renderActions(value, data);
      break;
    }
    case EnemySkillKinds.PowerHit: {
      const { value } = action as EnemySkill.WithValue<SkillValue>;
      children = <>
        <Asset assetId="status-angry" className="EnemySkills-icon" /> hit {
          renderValue(value, true)
        } next turn {renderDamage(value, data)}
      </>;
      break;
    }
    case EnemySkillKinds.Hit: {
      const { times, multiplier } = action as EnemySkill.Hit;
      children = <>
        hit {
          (times.min !== times.max || times.min !== 1) && <>{renderValue(times)} times of</>
        } {round(multiplier * 100, 2)}% damage {
          renderDamage({ min: multiplier, max: multiplier }, data, times)
        }
      </>;
      break;
    }
    case EnemySkillKinds.Angry: {
      const { value } = action as EnemySkill.WithValue<SkillValue>;
      children = <><Asset assetId="status-angry" className="EnemySkills-icon" /> {renderValue(value, true)}</>;
      break;
    }
    case EnemySkillKinds.ReduceDamage: {
      const { value } = action as EnemySkill.WithValue<SkillValue>;
      children = <><Asset assetId="status-def" className="EnemySkills-icon" /> {renderValue(value, true)}</>;
      break;
    }
    case EnemySkillKinds.Gravity: {
      const { value } = action as EnemySkill.WithValue<SkillValue>;
      children = <><Asset assetId="skill-gravity" className="EnemySkills-icon" /> {renderValue(value, true)}</>;
      break;
    }
    case EnemySkillKinds.ChangeInterval: {
      const { value } = action as EnemySkill.WithValue<number>;
      children = `change attack interval to ${value}`;
      break;
    }
    case EnemySkillKinds.Heal: {
      const { value, target } = action as EnemySkill.Heal;
      children = <>
        <Asset assetId="status-heal" className="EnemySkills-icon" />
        {target === 'player' && ' player'} {renderValue(value, true)}
      </>;
      break;
    }
    case EnemySkillKinds.TimeChange: {
      const { difference, multiplier } = action as EnemySkill.TimeChange;
      const isLess = difference > 0 || multiplier < 1;
      children = <>
        <Asset assetId={isLess ? 'status-time-decr' : 'status-time-incr'} className="EnemySkills-icon" />
        {difference !== 0 && ` ${difference} seconds`}
        {multiplier !== 1 && ` ${round(multiplier * 100)}%`}
      </>;
      break;
    }
    case EnemySkillKinds.ChangePlayerStat: {
      const { stat, multiplier, constant } = action as EnemySkill.ChangePlayerStat;
      let icon: React.ReactNode;
      switch (stat) {
        case 'rcv':
          icon = (
            <AssetBox className="EnemySkills-icon-box">
              <Asset assetId="orb-5" className="EnemySkills-icon" />
              {multiplier < 1 && <Asset assetId="overlay-decr" className="EnemySkills-icon" />}
              {multiplier > 1 && <Asset assetId="overlay-incr" className="EnemySkills-icon" />}
            </AssetBox>
          );
          break;
        case 'maxhp':
          icon = <Asset assetId="status-lock-maxhp" className="EnemySkills-icon" />;
          break;
      }
      children = <>
        {icon}
        {constant !== 0 && ` = ${constant}`}
        {multiplier !== 1 && ` ${round(multiplier * 100)}%`}
      </>;
      break;
    }
    case EnemySkillKinds.SkillDelay: {
      const { value } = action as EnemySkill.WithValue<SkillValue>;
      children = <>
        <AssetBox className="EnemySkills-icon-box">
          <Asset assetId="base-skill" className="EnemySkills-icon" />
          <Asset assetId="overlay-decr" className="EnemySkills-icon" />
        </AssetBox> {renderValue(value)} turns
      </>;
      break;
    }
    case EnemySkillKinds.ForbidOrbs: {
      const { value } = action as EnemySkill.WithValue<Attributes[]>;
      children = renderOrbs(value).map((orb, i) =>
        <AssetBox className="EnemySkills-icon-box" key={i}>
          {orb}
          <Asset assetId="overlay-cross" className="EnemySkills-icon" />
        </AssetBox>
      );
      break;
    }
    case EnemySkillKinds.ChangeAttribute: {
      const { value } = action as EnemySkill.WithValue<Attributes[]>;
      children = <>change self attribute &rArr; {renderAttrs(uniq(value))}</>;
      break;
    }
    case EnemySkillKinds.Resolve: {
      const { value } = action as EnemySkill.WithValue<SkillValue>;
      children = <><Asset assetId="status-resolve" className="EnemySkills-icon" /> {renderValue(value, true)}</>;
      break;
    }
    case EnemySkillKinds.Revive: {
      const { value } = action as EnemySkill.WithValue<SkillValue>;
      children = <>revive partner <Asset assetId="status-heal" className="EnemySkills-icon" /> {renderValue(value, true)}</>;
      break;
    }
    case EnemySkillKinds.Branch: {
      const { value } = action as EnemySkill.WithValue<number>;
      children = <>branch to action {value}</>;
      break;
    }
    case EnemySkillKinds.CheckPresence: {
      const { cardIds, branch } = action as EnemySkill.CheckPresence;
      children = <>
        branch to action {branch} in presence of <span className="EnemySkills-card-list">{
          cardIds.map(id => <CardIcon id={id} scale={0.3} key={id} />)
        }</span>
      </>;
      break;
    }
    case EnemySkillKinds.UpdateVar: {
      const { variable, action: act, value } = action as EnemySkill.UpdateVar;
      children = <>
        {{
          'set': 'Set ',
          'unset': 'Unset ',
          'decr': 'Decrement ',
          'incr': 'Increment ',
          'or': 'OR ',
          'xor': 'XOR ',
        }[act]}
        {{
          'flags': 'flags ',
          'counter': 'counter '
        }[variable]}
        {(act === 'set' || act === 'unset') && ` to ${value}`}
        {(act === 'incr' || act === 'decr') && ` by ${value}`}
        {(act === 'or' || act === 'xor') && ` with ${value}`}
      </>;
      break;
    }
    case EnemySkillKinds.Invincibility: {
      const { value } = action as EnemySkill.WithValue<boolean>;
      children = value ?
        <Asset assetId="status-damage-null" className="EnemySkills-icon" /> :
        <AssetBox className="EnemySkills-icon-box">
          <Asset assetId="status-damage-null" className="EnemySkills-icon" />
          <Asset assetId="overlay-cross" className="EnemySkills-icon" />
        </AssetBox>;
      break;
    }
    case EnemySkillKinds.FixPuzzleStart: {
      const { position } = action as EnemySkill.FixPuzzleStart;
      children = <>
        <Asset assetId="status-fixed" className="EnemySkills-icon" />
        {position ? ` (column ${position.column}, row ${position.row})` : ' random position'}
      </>;
      break;
    }
    case EnemySkillKinds.RotateOrbs: {
      const { target, time } = action as EnemySkill.RotateOrbs;
      children = <>
        <Asset assetId="status-rotate" className="EnemySkills-icon" />
        {renderLocation(target)} every {round(time, 2)} seconds
      </>;
      break;
    }
    case EnemySkillKinds.Bind: {
      const { team, attributes, types } = action as EnemySkill.Bind;
      children = <>
        <Asset assetId="status-bind" className="EnemySkills-icon" />
        {team && <>{team.count} of {
          isEqual(team.type, BindTeamTarget.all()) ? 'the cards' :
            team.type.map(type => ({
              [BindTeamTarget.Leader]: 'team leader',
              [BindTeamTarget.Members]: 'team members',
              [BindTeamTarget.Friend]: 'friend leader'
            })[type]).join(', ')}</>}
        {attributes && renderAttrs(attributes)}
        {types && renderTypes(types)}
      </>;
      break;
    }
    case EnemySkillKinds.Buff: {
      const s = action as EnemySkill.Buff;
      children = <>
        {s.damageVoid && <><Asset assetId="status-damage-void" className="EnemySkills-icon" /> {s.damageVoid}</>}
        {s.damageAbsorb && <><Asset assetId="status-damage-absorb" className="EnemySkills-icon" /> {s.damageAbsorb}</>}
        {s.comboAbsorb && <>
          <AssetBox className="EnemySkills-icon-box">
            <Asset assetId="status-combo" className="EnemySkills-icon" />
            <Asset assetId="overlay-heal" className="EnemySkills-icon" />
          </AssetBox> {s.comboAbsorb}
        </>}
        {s.attrsAbsorb && s.attrsAbsorb.map(attr =>
          <AssetBox className="EnemySkills-icon-box" key={attr}>
            <Asset assetId={`attr-${attr}`} className="EnemySkills-icon" />
            <Asset assetId="overlay-heal" className="EnemySkills-icon" />
          </AssetBox>
        )}
      </>;
      break;
    }
    case EnemySkillKinds.DamageResist: {
      const { value, attrs, types } = action as EnemySkill.DamageResist;
      children = <>
        {attrs && attrs.map(attr =>
          <AssetBox className="EnemySkills-icon-box" key={attr}>
            <Asset assetId="base-shield" className="EnemySkills-icon" />
            <Asset assetId={`attr-${attr}`} className="EnemySkills-icon" style={{ transform: 'scale(0.8)' }} />
          </AssetBox>
        )}
        {types && types.map(type =>
          <AssetBox className="EnemySkills-icon-box" key={type}>
            <Asset assetId="base-shield" className="EnemySkills-icon" />
            <Asset assetId={`type-${type}`} className="EnemySkills-icon" style={{ transform: 'scale(0.7)' }} />
          </AssetBox>
        )}
        &nbsp;{round(value * 100, 2)}%
      </>;
      break;
    }
    case EnemySkillKinds.OrbDropIncrease: {
      const { attrs, value, locked } = action as EnemySkill.OrbDropIncrease;
      let attrElems: React.ReactNode[];
      if (!attrs)
        attrElems = [<Asset assetId="orb-blind" className="EnemySkills-icon" key="any" />];
      else
        attrElems = renderOrbs(attrs);

      attrElems = attrElems.map((elem, i) => (
        <AssetBox className="EnemySkills-icon-box" key={i}>
          {elem}
          <Asset assetId="overlay-drop" className="EnemySkills-icon" />
          {locked && <Asset assetId="orb-locked" className="EnemySkills-icon" />}
        </AssetBox>
      ));

      children = <>{attrElems} {round(value * 100)}%</>;
      break;
    }
    case EnemySkillKinds.SetOrbState: {
      const { target, state, turns } = action as EnemySkill.SetOrbState;
      let stateText: string = '';
      let stateIcon: React.ReactNode;
      switch (state) {
        case 'locked':
          stateText = 'Lock';
          stateIcon = <Asset assetId="orb-locked" className="EnemySkills-icon" />;
          break;
        case 'blind':
          stateText = 'Blind';
          stateIcon = <Asset assetId="orb-blind" className="EnemySkills-icon" />;
          break;
        case 'super-blind':
          stateText = 'Super Blind';
          stateIcon = <AssetBox className="EnemySkills-icon-box">
            <Asset assetId="orb-blind" className="EnemySkills-icon" />
            <Asset assetId="orb-blind-super" className="EnemySkills-icon" style={{ transform: 'scale(0.75)' }} />
          </AssetBox>;
          break;
        case 'jail':
          stateText = 'Jail';
          stateIcon = <Asset assetId="orb-jail" className="EnemySkills-icon" />;
          break;
        case 'cloud':
          stateText = 'Cloud';
          stateIcon = <Asset assetId="orb-cloud" className="EnemySkills-icon" />;
          break;
      }

      children = <>{stateIcon} {stateText} {renderLocation(target)}{turns && ` for ${turns} turns`}</>;
      break;
    }
    case EnemySkillKinds.ChangeOrbs: {
      const { changes } = action as EnemySkill.ChangeOrbs;

      children = <>
        {changes.map(({ from, to, exclude, locked }, i) => {
          return <span key={i}>{i !== 0 && ', '}
            {renderLocation(from)}
            {
              exclude && renderOrbs(exclude).map((orb, j) => (
                <AssetBox className="EnemySkills-icon-box" key={j}>
                  {orb}
                  <Asset assetId="overlay-cross" className="EnemySkills-icon" />
                </AssetBox>
              ))
            } &rArr; {renderOrbs(to).map((orb, j) => locked ?
              <AssetBox className="EnemySkills-icon-box" key={j}>
                {orb}
                <Asset assetId="orb-locked" className="EnemySkills-icon" />
              </AssetBox> : orb
            )}</span>;
        })}
      </>;
      break;
    }
    case EnemySkillKinds.StatusShield: {
      children = <Asset assetId="status-shield" className="EnemySkills-icon" />;
      break;
    }
    case EnemySkillKinds.BindAwakenings: {
      children = <Asset assetId="status-bind-awakenings" className="EnemySkills-icon" />;
      break;
    }
    case EnemySkillKinds.BindSkills: {
      children = <Asset assetId="status-bind-skill" className="EnemySkills-icon" />;
      break;
    }
    case EnemySkillKinds.LeaderChange: {
      children = <Asset assetId="status-leader-change" className="EnemySkills-icon" />;
      break;
    }
    case EnemySkillKinds.FixTarget: {
      children = (
        <AssetBox className="EnemySkills-icon-box">
          <Asset assetId="status-fixed" className="EnemySkills-icon" />
          <Asset assetId="orb-locked" className="EnemySkills-icon" />
        </AssetBox>
      );
      break;
    }
    case EnemySkillKinds.EraseBuffs: {
      children = 'erase player buffs';
      break;
    }
    case EnemySkillKinds.Stop: {
      children = 'stop action';
      break;
    }
    case EnemySkillKinds.DisplayCounter: {
      children = 'display counter';
      break;
    }
    case EnemySkillKinds.Preemptive: {
      children = 'has preemptive actions';
      break;
    }
    case EnemySkillKinds.Nop: {
      children = 'do nothing';
      break;
    }
  }

  return <div className="EnemySkills-skill">{children}</div>;
}