import { ExpansionPanel, ExpansionPanelDetails, ExpansionPanelSummary, Icon, Paper, Typography } from '@material-ui/core';
import { isEqual, orderBy, sum, take } from 'lodash';
import { computed } from 'mobx';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { CardIcon } from 'src/components/cards/CardIcon';
import { DungeonEnemyDetails } from 'src/components/dungeon/DungeonEnemyDetails';
import { Attributes, Card, ConditionType, Dungeon, DungeonData, DungeonEnemy, RFlags1, RFlags2, Types } from 'src/models';
import { parse } from 'src/parsers/DungeonNameParser';
import { Store } from 'src/store';
import { parseFlags, prop, store, withWidth } from 'src/utils';
import './DungeonDetails.css';

/* tslint:disable:no-bitwise */

export interface DungeonDetailsProps {
  className?: string;
  dungeon: Dungeon;
  floor: number;
}

@withWidth()
@inject('store')
@observer
export class DungeonDetails extends React.Component<DungeonDetailsProps> {
  @store
  private readonly store: Store;

  @prop('width')
  private readonly width: string;

  @computed
  private get dungeon() {
    return this.props.dungeon;
  }

  @computed
  private get floor() {
    return this.props.dungeon.floors.find(floor => floor.id === Number(this.props.floor))!;
  }

  private get data() {
    return this.store.gameData.waves
      .find(data => data.dungeon === this.props.dungeon.id && data.floor === this.props.floor);
  }

  public render() {
    const dungeon = this.dungeon;
    const floor = this.floor;
    const data = this.data;

    const statsMul = { hp: 1, atk: 1, def: 1 };
    const notes: React.ReactNode[] = [];
    if (floor.rflags1 & RFlags1.Technical) notes.push('Technical dungeon');
    if (floor.rflags1 & RFlags1.SkillCharged) notes.push('All skills charged');
    if (floor.rflags1 & RFlags1.Scoring) notes.push(`S-rank score: ${floor.score}`);

    if (floor.rflags2 & RFlags2.NoFire) notes.push('No fire orbs');
    if (floor.rflags2 & RFlags2.NoWater) notes.push('No water orbs');
    if (floor.rflags2 & RFlags2.NoWood) notes.push('No wood orbs');
    if ((floor.rflags1 & RFlags1.NoLight) || (floor.rflags2 & RFlags2.NoLight)) notes.push('No light orbs');
    if ((floor.rflags1 & RFlags1.NoDark) || (floor.rflags2 & RFlags2.NoDark)) notes.push('No dark orbs');
    if (floor.rflags2 & RFlags2.NoHeart) notes.push('No heart orbs');

    if (floor.rflags2 & RFlags2.NoActiveSkill) notes.push('Active skill invalid');
    if (floor.rflags2 & RFlags2.NoLeaderSkill) notes.push('Leader skill invalid');
    if (floor.rflags2 & RFlags2.NoContinue) notes.push('No continue');
    if (floor.rflags2 & RFlags2.NoRewards) notes.push('No rewards');
    if (floor.rflags2 & RFlags2.NoAwokenSkill) notes.push('Awakenings invalid');

    for (const property of (floor.properties || [])) {
      if (property === '5*4') notes.push('5x4 board');
      if (property === '7*6') notes.push('7x6 board');
      if (property === 'ndf') notes.push('No skyfall');
      const match = /^([^:]+):(.*)$/.exec(property);
      if (!match) continue;
      const [, tag, value] = match;
      switch (tag) {
        case 'ta':
          notes.push(`Time attack: ${Number(value)}s`);
          break;
        case 'hpfix':
          notes.push(`Fixed ${Number(value)} HP`);
          break;
        case 'ft':
          notes.push(`Fixed ${Number(value) / 10}s movement time`);
          break;

        case 'hp': statsMul.hp = Number(value) / 10000; break;
        case 'at': statsMul.atk = Number(value) / 10000; break;
        case 'df': statsMul.def = Number(value) / 10000; break;

        case 'battr': {
          const [flags, atk, hp, rcv] = value.split(';').map(Number);
          const attrs = parseFlags(flags).map(attr => Attributes.names[attr]).join(', ');
          notes.push(`${attrs} attribute: ${hp / 1000}x HP, ${atk / 1000}x ATK, ${rcv / 1000}x RCV`);
          break;
        }
        case 'btype': {
          const [flags, atk, hp, rcv] = value.split(';').map(Number);
          const types = parseFlags(flags).map(type => Types.names[type]).join(', ');
          notes.push(`${types} type: ${hp / 10000}x HP, ${atk / 10000}x ATK, ${rcv / 10000}x RCV`);
          break;
        }
        case 'brare': {
          const [flags, atk, hp, rcv] = value.split(';').map(Number);
          const rarity = parseFlags(flags).join(', ');
          notes.push(`${rarity} rarity: ${hp / 10000}x HP, ${atk / 10000}x ATK, ${rcv / 10000}x RCV`);
          break;
        }
        case 'fc1':
        case 'fc2':
        case 'fc3':
        case 'fc4':
        case 'fc5':
        case 'fc6': {
          const position = Number(tag.charAt(2));
          const [id, level, hp, atk, rcv, awakenings, slevel] = value.split(';').map(Number);
          const card = this.store.gameData.getCard(id)!;
          const skill = this.store.gameData.getSkill(card.activeSkillId)!;
          notes.push(<>
            Fixed team member {position}: LV {level || 1}
            <CardIcon id={id} scale={0.4} className="DungeonDetails-notes-card" />
            {hp && `, +${hp} HP`}
            {atk && `, +${atk} ATK`}
            {rcv && `, +${hp} RCV`}
            {awakenings && `, ${Math.min(awakenings, card.awakenings.length)} awakenings`}
            {slevel && `, skill LV ${slevel >= skill.maxLevel ? 'MAX' : slevel}`}
          </>);
          break;
        }
      }
    }

    if (floor.conditions) {
      const { type, values } = floor.conditions;
      switch (type) {
        case ConditionType.Cost:
          notes.push(`Maximum team cost: ${values[0]}`); break;
        case ConditionType.Rarity:
          notes.push(`Maximum team member rarity: ${values[0]}`); break;
        case ConditionType.Type:
          notes.push(`Team member type required: ${values.map(t => Types.names[t - 1])}`); break;
        case ConditionType.Attributes:
          if (isEqual(values, Attributes.all()))
            notes.push('All attributes required');
          else
            notes.push(`Team member attribute required: ${values.map(attr => Attributes.names[attr - 1])}`);
          break;
        case ConditionType.NoDupe:
          notes.push('No duplicated members'); break;
        case ConditionType.RogueLike:
          notes.push('Rogue-like: cards start at level 1'); break;
        case ConditionType.Card:
          notes.push(<>Required card: <CardIcon id={values[0]} scale={0.4} className="DungeonDetails-notes-card" /></>); break;
        case ConditionType.Count:
          notes.push(`Maximum ${values[0]} team members`); break;
      }
    }

    function statEntry(header: React.ReactNode, content: React.ReactNode) {
      return (
        <div className="DungeonDetails-stats-entry">
          <span className="DungeonDetails-stats-header">{header}</span>
          <span className="DungeonDetails-stats-value">{content}</span>
        </div>
      );
    }

    const expCoin = data && this.computeExpCoin(data);
    const exp = expCoin && (expCoin.minExp === expCoin.maxExp ?
      expCoin.minExp :
      `${expCoin.minExp} ~ ${expCoin.maxExp}`
    );
    const coin = expCoin && (expCoin.minCoin === expCoin.maxCoin ?
      expCoin.minCoin :
      `${expCoin.minCoin} ~ ${expCoin.maxCoin}`
    );

    return (
      <article className={`${this.props.className || ''} DungeonDetails-root`}>
        <Paper component="section" className="DungeonDetails-section" style={{ padding: 16 }}>
          <div className="DungeonDetails-header">
            <Typography variant="title" component={Link as any} {...{ to: `/dungeons/${dungeon.id}` }}>
              {parse(dungeon.name).name}
            </Typography>
            &raquo;
            <Typography variant="title">
              {parse(floor.name).name}
            </Typography>
          </div>
          <ul className="DungeonDetails-notes">{
            notes.map((note, i) => <li key={i}>{note}</li>)
          }</ul>
          <div className="DungeonDetails-stats">
            {statEntry('Stamina', floor.stamina)}
            {statEntry('Waves', floor.waves)}
            {exp && statEntry('Exp', exp)}
            {coin && statEntry('Coin', coin)}
          </div>
        </Paper>
        {data && <section className="DungeonDetails-section">{
          data.waves.map((wave, i) => (
            <ExpansionPanel key={i} defaultExpanded={this.width !== 'xs'}>
              <ExpansionPanelSummary expandIcon={<Icon>expand_more</Icon>}>
                <div className="DungeonDetails-wave-header">
                  <Typography>Wave {i + 1}</Typography>
                  {wave.type === 'random' &&
                    <Typography variant="caption" className="DungeonDetails-wave-type">{
                      wave.minEnemies === wave.maxEnemies ?
                        `random ${wave.minEnemies} enemies` :
                        `random ${wave.minEnemies} ~ ${wave.maxEnemies} enemies`
                    }</Typography>
                  }
                </div>
              </ExpansionPanelSummary>
              <ExpansionPanelDetails className="DungeonDetails-wave-details">
                {wave.enemies.map((enemy, j) =>
                  <DungeonEnemyDetails
                    key={j} className="DungeonDetails-enemy"
                    enemy={enemy} technical={(floor.rflags1 & RFlags1.Technical) !== 0}
                    statsMul={statsMul}
                  />)
                }
              </ExpansionPanelDetails>
            </ExpansionPanel>
          ))
        }</section>}
      </article>
    );
  }

  private computeExpCoin(data: DungeonData) {
    let minExp = 0;
    let maxExp = 0;
    let minCoin = 0;
    let maxCoin = 0;
    const stats = (enemy: DungeonEnemy) => {
      const { exp, coin } = Card.enemyStats(this.store.gameData.getCard(enemy.id)!, enemy.level);
      return { exp: Math.round(exp), coin: Math.round(coin) };
    };

    for (const wave of data.waves) {
      const enemyStats = wave.enemies.map(stats);
      if (wave.type === 'template') {
        for (const { exp, coin } of enemyStats) {
          minExp += exp; maxExp += exp;
          minCoin += coin; maxCoin += coin;
        }
      } else {
        minExp += sum(take(orderBy(enemyStats, s => s.exp, 'asc'), wave.minEnemies).map(s => s.exp));
        minCoin += sum(take(orderBy(enemyStats, s => s.coin, 'asc'), wave.minEnemies).map(s => s.coin));
        maxExp += sum(take(orderBy(enemyStats, s => s.exp, 'desc'), wave.maxEnemies).map(s => s.exp));
        maxCoin += sum(take(orderBy(enemyStats, s => s.coin, 'desc'), wave.maxEnemies).map(s => s.coin));
      }
    }
    return { minExp, maxExp, minCoin, maxCoin };
  }
}