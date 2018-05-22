import React from 'react';
import { observer } from 'mobx-react';
import { AutoSizer, Grid, GridCellProps, ScrollParams } from 'react-virtualized';

import { Store } from 'app/store';
import { Page } from 'app/components/page';
import { IconSize } from 'app/renderer/icon';
import { CardIcon } from 'app/components/cardIcon';
import { RecyclingGrid } from 'app/components/recyclingGrid';
import css from 'styles/pages/main.scss';
import { observable, action, autorun } from 'mobx';

const NumCardPerRow = 10;

class MainState {
  @observable public scrollTop = 0;
  @observable public scrollLeft = 0;
}

@observer
export default class Main extends React.Component {
  private readonly store = Store.instance;
  private readonly _state = this.store.getState(this, MainState);

  private cards: any[];
  private cardsReactionDisposer = autorun(() => {
    this.cards = this.store.gameDB.cards && this.store.gameDB.cards.filter(card => card.id < 100000);
  });

  constructor(props: any) {
    super(props);
    this.renderCard = this.renderCard.bind(this);
  }

  componentWillUnmount() {
    this.cardsReactionDisposer();
  }

  @action.bound
  private onScroll(scroll: ScrollParams) {
    this._state.scrollTop = scroll.scrollTop;
    this._state.scrollLeft = scroll.scrollLeft;
  }

  private renderCard({ key, rowIndex, columnIndex, style }: GridCellProps) {
    const index = rowIndex * NumCardPerRow + columnIndex;
    if (index >= this.cards.length) return null;

    const card = this.cards[index];
    if (card.isEmpty) return null;

    return <CardIcon id={card.id} key={key} style={style} />
  }

  render() {
    return Page(() =>
      <div className={css.root}>
        <AutoSizer>{({ width, height }) =>
          <RecyclingGrid width={width} height={height} className={css.cardGrid}
            scrollTop={this._state.scrollTop} scrollLeft={this._state.scrollLeft}
            rowHeight={IconSize} rowCount={Math.ceil(this.cards.length / NumCardPerRow)}
            columnWidth={IconSize} columnCount={NumCardPerRow} overscanRowCount={0}
            cellRenderer={this.renderCard}
            onScroll={this.onScroll}>
          </RecyclingGrid>
        }</AutoSizer>
      </div>
    );
  }
}
