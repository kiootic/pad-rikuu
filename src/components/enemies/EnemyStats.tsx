import { FormControl, TextField } from '@material-ui/core';
import { computed } from 'mobx';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { Curve } from 'src/models';
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
  private get card() { return this.store.gameData.cards.find(card => card.id === this.id)!; }

  @computed
  private get level() { return this.props.level; }

  @computed private get maxLevel() { return this.card.enemy.maxLevel; }
  @computed private get hp() { return this.curve(this.card.enemy.hp); }
  @computed private get atk() { return this.curve(this.card.enemy.atk); }
  @computed private get def() { return this.curve(this.card.enemy.def); }
  @computed private get exp() { return this.curve({ min: this.card.enemy.exp / 2 }); }
  @computed private get coin() { return this.curve({ min: this.card.enemy.coin / 2 }); }

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

    return (
      <div className="EnemyStats-root">
        {entry('LV',
          <FormControl className="EnemyStats-level">
            <TextField type="number" value={this.level} onChange={this.selectLevel} />
          </FormControl>
        )}
        {entry('EXP', this.exp)}
        {entry('COIN', this.coin)}
        {entry('HP', this.hp)}
        {entry('ATK', this.atk)}
        {entry('DEF', this.def)}
      </div>
    );
  }

  @bound
  private selectLevel(e: React.ChangeEvent<HTMLInputElement>) {
    this.props.selectLevel(Number(e.target.value));
  }

  private curve(curve: Curve | { min: number, max?: number, scale?: number }) {
    const level = this.level;

    const realCurve: Curve = {
      min: curve.min,
      max: curve.max || (curve.min * this.maxLevel),
      scale: curve.scale || 1
    };

    const value = Curve.valueAt(level, this.maxLevel, realCurve);
    return Math.round(value);
  }
}