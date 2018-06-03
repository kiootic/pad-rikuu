import { computed } from 'mobx';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { Store } from 'src/store';
import { store } from 'src/utils';
import './EnemySkills.css';

export interface EnemySkillsProps {
  id: number;
  level: number;
}

@inject('store')
@observer
export class EnemySkills extends React.Component<EnemySkillsProps> {
  @store
  private readonly store: Store;

  @computed
  private get id() { return this.props.id || 0; }

  @computed
  private get card() { return this.store.gameData.cards.find(card => card.id === this.id)!; }

  public render() {
    if (!this.card) return null;

    const skills = this.card.enemy.skills;
    return (
      <div className="EnemySkills-root">{
        skills.map(({ id, ai, rnd }, i) => {
          const skill = this.store.gameData.enemySkills.find(s => s.id === id)!;
          return <p key={i}>{skill.name} {ai} {rnd}</p>;
        })
      }</div>
    );
  }
}