import { action, computed } from 'mobx';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { AutoSizer, GridCellProps, ScrollParams } from 'react-virtualized';
import { RecyclingGrid } from 'src/components/base';
import { CardIcon } from 'src/components/cards/CardIcon';
import { Card } from 'src/models';
import { IconSize } from 'src/renderer/CardIconRenderer';
import { Store } from 'src/store';
import { bound, store, uiState } from 'src/utils';
import './CardList.css';

const NumCardPerRow = 10;

interface CardListState {
  scrollTop: number;
}

@inject('store')
@observer
export class CardList extends React.Component<RouteComponentProps<{}>> {
  @store
  private readonly store: Store;

  @uiState<CardListState>('CardList', () => ({ scrollTop: 0 }))
  private readonly uiState: CardListState;

  private _cards: Card[];
  private _cardsPerRow: number;
  private _iconScale: number;

  public render() {
    this._cards = this.cards;
    const scrollTop = this.uiState.scrollTop;
    return (
      <AutoSizer>{({ width, height }) => {
        this._cardsPerRow = IconSize * NumCardPerRow > width ? NumCardPerRow / 2 : NumCardPerRow;
        this._iconScale = Math.min(1, width / (IconSize * this._cardsPerRow));

        return <RecyclingGrid width={width} height={height} className="CardList-grid"
          rowHeight={IconSize * this._iconScale} rowCount={Math.ceil(this._cards.length / this._cardsPerRow)}
          columnWidth={IconSize * this._iconScale} columnCount={this._cardsPerRow} cellRenderer={this.renderCard}
          onScroll={this.onScroll} scrollTop={scrollTop} tabIndex={null}
        />;
      }}</AutoSizer>
    );
  }

  @computed
  private get cards() { return this.store.gameData.cards.filter(card => Card.section(card.id) === 0); }

  @bound
  private renderCard({ key, rowIndex, columnIndex, style }: GridCellProps) {
    const index = rowIndex * this._cardsPerRow + columnIndex;
    if (index >= this._cards.length) return null;

    const card = this._cards[index];
    if (card.isEmpty) return null;

    return <div style={style} key={key}><CardIcon id={card.id} scale={this._iconScale} /></div>;
  }

  @action.bound
  private onScroll(params: ScrollParams) {
    this.uiState.scrollTop = params.scrollTop;
  }
}