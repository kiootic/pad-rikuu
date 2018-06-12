import { computed } from 'mobx';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { CardIcon } from 'src/components/cards/CardIcon';
import { EnemySkills } from 'src/components/enemies/EnemySkills';
import { Curve, DungeonEnemy } from 'src/models';
import { Store } from 'src/store';
import { store } from 'src/utils';
import './DungeonEnemyDetails.css';

export interface DungeonEnemyDetailsProps {
  className?: string;
  enemy: DungeonEnemy;
  technical: boolean;
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

    function curveValue(curve: Curve) {
      return Math.round(Curve.valueAt(enemy.level, card.enemy.maxLevel, curve));
    }

    return (
      <div className={`${this.props.className || ''} DungeonEnemyDetails-root`}>
        <CardIcon id={enemy.id} scale={0.75} />
        <div className="DungeonEnemyDetails-content">
          <div className="DungeonEnemyDetails-stats">
            {statEntry('HP', curveValue(card.enemy.hp))}
            {statEntry('DEF', curveValue(card.enemy.def))}
            {statEntry('ATK', curveValue(card.enemy.atk))}
            {statEntry('TURN', card.enemy.countdown)}
          </div>
          {
            enemy.drops.length > 0 && <div className="DungeonEnemyDetails-drops">
              drops: {
                enemy.drops.map((drop, i) => <React.Fragment key={i}>
                  {i !== 0 && ', '}
                  LV {drop.level} <CardIcon id={drop.id} scale={0.3} />
                </React.Fragment>)
              } </div>
          }
          {this.props.technical &&<EnemySkills id={enemy.id} level={enemy.level} />}
        </div>
      </div>
    );
  }
}