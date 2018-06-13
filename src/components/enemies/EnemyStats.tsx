import { FormControl, TextField } from '@material-ui/core';
import { computed } from 'mobx';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { Card } from 'src/models';
import { Store } from 'src/store';
import { bound, store } from 'src/utils';
import './EnemyStats.css';

export interface EnemyStatsProps {
  id: number;
  level: number;
  selectLevel: (level: number) => void;
}

@inject('store')
@observer
export class EnemyStats extends React.Component<EnemyStatsProps> {
  @store
  private readonly store: Store;

  @computed
  private get id() { return this.props.id || 0; }

  @computed
  private get card() { return this.store.gameData.getCard(this.id)!; }

  @computed
  private get level() { return this.props.level; }

  @computed private get stats() { return Card.enemyStats(this.card, this.level); }

  public render() {
    if (!this.card) return null;

    function entry(header: React.ReactNode, content: React.ReactNode) {
      return (
        <div className="EnemyStats-entry">
          <span className="EnemyStats-header">{header}</span>
          <span className="EnemyStats-value">{content}</span>
        </div>
      );
    }

    const stats = this.stats;

    return (
      <div className="EnemyStats-root">
        {entry('LV',
          <FormControl className="EnemyStats-level">
            <TextField type="number" value={this.level} onChange={this.selectLevel} />
          </FormControl>
        )}
        {entry('EXP', Math.round(stats.exp))}
        {entry('COIN', Math.round(stats.coin))}
        {entry('HP', Math.round(stats.hp))}
        {entry('ATK', Math.round(stats.atk))}
        {entry('DEF', Math.round(stats.def))}
      </div>
    );
  }

  @bound
  private selectLevel(e: React.ChangeEvent<HTMLInputElement>) {
    this.props.selectLevel(Number(e.target.value));
  }
}