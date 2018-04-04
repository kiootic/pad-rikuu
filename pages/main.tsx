import React from 'react';
import { observer } from 'mobx-react';
import { AutoSizer, Grid, GridCellProps, ScrollParams } from 'react-virtualized';

import { Store } from 'app/store';
import { Page } from 'app/components/page';
import { CardSize } from 'app/renderer/card';
import { Card } from 'app/components/card';
import css from 'styles/pages/main.scss';
import { observable, action } from 'mobx';

const NumCardPerRow = 10;

class MainState {
  @observable public scrollLeft = 0;
  @observable public scrollRight = 0;
}

@observer
export default class Main extends React.Component {
  private readonly store = Store.instance;
  private readonly _state = this.store.getState(this, MainState);

  constructor(props: any) {
    super(props);
    this.renderCard = this.renderCard.bind(this);
  }

  @action.bound
  private onScroll(scroll: ScrollParams) {
    this._state.scrollTop = scroll.scrollTop;
    this._state.scrollLeft = scroll.scrollLeft;
  }

  private renderCard({ key, rowIndex, columnIndex, style }: GridCellProps) {
    const index = rowIndex * NumCardPerRow + columnIndex;
    if (index >= this.store.gameDB.cards.length) return null;

    const card = this.store.gameDB.cards[index];
    if (card.isEmpty) return null;

    return <Card id={card.id} key={key} style={style} />
  }

  render() {
    return Page(() =>
      <div className={css.root}>
        <AutoSizer>{({ width, height }) =>
          <Grid width={width} height={height} className={css.cardGrid}
            scrollTop={this._state.scrollTop} scrollLeft={this._state.scrollLeft}
            rowHeight={CardSize} rowCount={Math.ceil(this.store.gameDB.cards.length / NumCardPerRow)}
            columnWidth={CardSize} columnCount={NumCardPerRow}
            cellRenderer={this.renderCard}
            onScroll={this.onScroll}>
          </Grid>
        }</AutoSizer>
      </div>
    );
  }
}
