import { FormControl } from '@material-ui/core';
import { range } from 'lodash';
import { action, computed, IReactionDisposer, observable, reaction } from 'mobx';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { AppSelect } from 'src/components/base';
import { Card } from 'src/models';
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
  private get card() { return this.store.gameData.getCard(this.id)!; }

  private disposer: IReactionDisposer;

  @computed private get stats() { return Card.cardStats(this.card, this.selectedLevel); }

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

    const stats = this.stats;

    return (
      <div className="CardStats-root">
        {entry('LV',
          <FormControl>
            <AppSelect value={this.selectedLevel} onChange={this.selectLevel}>{
              range(1, stats.maxLevel + 1)
                .map(lv => <option key={lv} value={lv}>
                  {lv === this.card.maxLevel && this.card.maxLevel === stats.maxLevel ? 'MAX' : lv}
                </option>)
            }</AppSelect>
          </FormControl>
        )}
        {entry('HP', Math.round(stats.hp))}
        {entry('ATK', Math.round(stats.atk))}
        {entry('RCV', Math.round(stats.rcv))}
        {entry('EXP', Math.round(stats.exp))}
        {entry('FEED EXP', Math.round(stats.feedExp))}
        {entry('COIN', Math.round(stats.coin))}
        {entry('MP', this.card.sellMP)}
      </div>
    );
  }

  @action.bound
  private selectLevel(e: React.ChangeEvent<HTMLSelectElement>) {
    this.selectedLevel = Number(e.target.value);
  }
}