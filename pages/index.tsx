import React from 'react';
import { observer } from 'mobx-react';
import { AutoSizer, Grid, GridCellProps } from 'react-virtualized';

import { Store } from 'app/store';
import { Page } from 'app/components/page';
import { CardSize } from 'app/renderer/card';
import { Card } from 'app/components/card';
import css from 'styles/index.scss';

const NumCardPerRow = 10;

@observer
export default class Index extends React.Component {
  private store = Store.instance;

  constructor(props: any) {
    super(props);
  }

  renderCard({ key, rowIndex, columnIndex, style }: GridCellProps) {
    const index = rowIndex * NumCardPerRow + columnIndex;
    if (index >= this.store.gameDB.cards.length) return null;

    const card = this.store.gameDB.cards[index];
    if (card.isEmpty) return null;

    return <Card id={card.id} key={key} style={style} />
  }

  render() {
    return (
      <Page>
        <AutoSizer>{({ width, height }) =>
          <Grid width={width} height={height} className={css.cardGrid}
            rowHeight={CardSize} rowCount={Math.ceil(this.store.gameDB.cards.length / NumCardPerRow)}
            columnWidth={CardSize} columnCount={NumCardPerRow}
            cellRenderer={this.renderCard.bind(this)}>
          </Grid>
        }</AutoSizer>
      </Page>
    )
  }
}
