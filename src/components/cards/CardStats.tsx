import { FormControl } from '@material-ui/core';
import { range } from 'lodash';
import { action, computed, IReactionDisposer, observable, reaction } from 'mobx';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { AppSelect } from 'src/components/base';
import { Curve } from 'src/models';
import { Store } from 'src/store';
import { store } from 'src/utils';
import './CardStats.css';

export interface CardStatsProps {
  id: number;
}

@inject('store')
@observer
export class CardStats extends React.Component<CardStatsProps> {
  @store
  private readonly store: Store;

  @observable
  private selectedLevel: number;

  @computed
  private get id() { return this.props.id || 0; }

  @computed
  private get card() { return this.store.gameData.cards.find(card => card.id === this.id)!; }

  private disposer: IReactionDisposer;

  @computed private get maxLevel() { return this.card.maxLevel + (this.card.limitBreakIncr > 0 ? 11 : 0); }
  @computed private get hp() { return this.curve(this.card.hp); }
  @computed private get atk() { return this.curve(this.card.atk); }
  @computed private get rcv() { return this.curve(this.card.rcv); }
  @computed private get exp() { return this.expCurve(this.card.exp); }
  @computed private get coin() { return this.curve({ min: this.card.sellPrice / 10 }); }
  @computed private get feed() { return this.curve({ min: this.card.feedExp / 4 }); }

  public componentDidMount() {
    this.disposer = reaction(() => this.card, card => {
      this.selectedLevel = card ? card.maxLevel : 1;
    }, { fireImmediately: true });
  }

  public componentWillUnmount() {
    this.disposer();
  }

  public render() {
    if (!this.card || !this.selectedLevel) return null;

    function entry(header: React.ReactNode, content: React.ReactNode) {
      return (
        <div className="CardStats-entry">
          <span className="CardStats-header">{header}</span>
          <span className="CardStats-value">{content}</span>
        </div>
      );
    }

    return (
      <div className="CardStats-root">
        {entry('LV',
          <FormControl>
            <AppSelect value={this.selectedLevel} onChange={this.selectLevel}>{
              range(1, this.maxLevel + 1)
                .map(lv => <option key={lv} value={lv}>
                  {lv === this.card.maxLevel && this.card.maxLevel === this.maxLevel ? 'MAX' : lv}
                </option>)
            }</AppSelect>
          </FormControl>
        )}
        {entry('HP', this.hp)}
        {entry('ATK', this.atk)}
        {entry('RCV', this.rcv)}
        {entry('EXP', this.exp)}
        {entry('FEED EXP', this.feed)}
        {entry('COIN', this.coin)}
        {entry('MP', this.card.sellMP)}
      </div>
    );
  }

  @action.bound
  private selectLevel(e: React.ChangeEvent<HTMLSelectElement>) {
    this.selectedLevel = Number(e.target.value);
  }

  private curve(curve: Curve | { min: number, max?: number, scale?: number }) {
    const card = this.card;
    const level = this.selectedLevel;

    const realCurve: Curve = {
      min: curve.min,
      max: curve.max || (curve.min * card.maxLevel),
      scale: curve.scale || 1
    };

    let value = Curve.valueAt(level, card.maxLevel, realCurve);
    if (level > card.maxLevel) {
      const exceed = level - card.maxLevel;
      value += curve.max ? (curve.max * (card.limitBreakIncr / 100) * (exceed / 11)) : curve.min * exceed;
    }
    return Math.round(value);
  }

  private expCurve(curve: Curve) {
    const card = this.card;
    const level = this.selectedLevel;

    return Math.round(
      Curve.valueAt(level, card.maxLevel, curve) +
      Math.max(0, level - card.maxLevel - 1) * 5000000
    );
  }
}