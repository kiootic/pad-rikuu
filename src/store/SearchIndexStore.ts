import { action, observable, reaction } from 'mobx';
import { Card } from 'src/models';
import { BaseStore } from 'src/store/BaseStore';

export interface SearchEntry<T=any> {
  key: string;
  text: string;

  type: 'card' | null;
  item: T;
}

export class SearchIndexStore extends BaseStore {
  @observable.shallow
  public readonly entries: SearchEntry[] = [];

  protected async doLoad() {
    reaction(() => [
      this.root.gameData.cards
    ], ([cards]) => this.buildIndex(cards));
  }

  @action
  private buildIndex(cards: Card[]) {
    this.entries.length = 0;

    for (const card of cards) {
      if (card.isEmpty) continue;
      this.entries.push({
        key: `card:${card.id}`,
        text: `${card.id} - ${card.name}`,
        type: 'card',
        item: card
      } as SearchEntry<Card>);
    }
  }
}