import { computed } from 'mobx';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { CardIcon } from 'src/components/cards/CardIcon';
import { EnemySkills } from 'src/components/enemies/EnemySkills';
import { Card, DungeonEnemy } from 'src/models';
import { Store } from 'src/store';
import { store } from 'src/utils';
import './DungeonEnemyDetails.css';

export interface DungeonEnemyDetailsProps {
  className?: string;
  enemy: DungeonEnemy;
  technical: boolean;
  statsMul?: { hp: number, atk: number, def: number };
}

@inject('store')
@observer
export class DungeonEnemyDetails extends React.Component<DungeonEnemyDetailsProps> {
  @store
  private readonly store: Store;

  @computed
  private get enemy() {
    return this.props.enemy;
  }

  public render() {
    const enemy = this.enemy;
    const card = this.store.gameData.getCard(enemy.id)!;

    function statEntry(header: React.ReactNode, content: React.ReactNode) {
      return (
        <div className="DungeonEnemyDetails-stats-entry">
          <span className="DungeonEnemyDetails-stats-header">{header}</span>
          <span className="DungeonEnemyDetails-stats-value">{content}</span>
        </div>
      );
    }

    function dropEntry(id: number, level: number) {
      if (id === 9900)
        return <>{level} coins</>;
      else
        return <>LV {level} <CardIcon id={id} scale={0.3} /></>;
    }

    const stats = Card.enemyStats(card, enemy.level);
    if (this.props.statsMul) {
      stats.hp *= this.props.statsMul.hp;
      stats.atk *= this.props.statsMul.atk;
      stats.def *= this.props.statsMul.def;
    }
    stats.hp = Math.round(stats.hp);
    stats.atk = Math.round(stats.atk);
    stats.def = Math.round(stats.def);

    return (
      <div className={`${this.props.className || ''} DungeonEnemyDetails-root`}>
        <CardIcon id={enemy.id} scale={0.75} />
        <div className="DungeonEnemyDetails-content">
          <div className="DungeonEnemyDetails-stats">
            {statEntry('HP', stats.hp)}
            {statEntry('DEF', stats.def)}
            {statEntry('ATK', stats.atk)}
            {statEntry('TURN', card.enemy.countdown)}
          </div>
          {
            enemy.drops.length > 0 && <div className="DungeonEnemyDetails-drops">
              drops: {
                enemy.drops.map((drop, i) => <React.Fragment key={i}>
                  {i !== 0 && ', '}
                  {dropEntry(drop.id, drop.level)}
                </React.Fragment>)
              } </div>
          }
          {this.props.technical && <EnemySkills id={enemy.id} level={enemy.level} stats={stats} />}
        </div>
      </div>
    );
  }
}