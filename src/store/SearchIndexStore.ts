import { action, observable, reaction } from 'mobx';
import { Card, Dungeon, DungeonData, Floor } from 'src/models';
import { parse as parseDungeonName } from 'src/parsers/DungeonNameParser';
import { BaseStore } from 'src/store/BaseStore';

export interface SearchEntry<T=any> {
  key: string;
  text: string;

  type: 'card' | 'dungeon' | null;
  item: T;
}

export class SearchIndexStore extends BaseStore {
  @observable.shallow
  public readonly entries: SearchEntry[] = [];

  protected async doLoad() {
    reaction(() => ({
      cards: this.root.gameData.cards,
      dungeons: this.root.gameData.dungeons,
      waves: this.root.gameData.waves
    }), ({ cards, dungeons, waves }) => this.buildIndex(cards, dungeons, waves));
  }

  @action
  private buildIndex(cards: Card[], dungeons: Dungeon[], waves: DungeonData[]) {
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

    const dungeonMap = new Map(dungeons.map<[number, Dungeon]>(dungeon => [dungeon.id, dungeon]));
    for (const wave of waves) {
      const dungeon = dungeonMap.get(wave.dungeon)!;
      const floor = dungeon.floors.find(f => f.id === wave.floor)!;
      this.entries.push({
        key: `dungeon:${dungeon.id}:${floor.id}`,
        text: `${parseDungeonName(dungeon.name).name} - ${parseDungeonName(floor.name).name}`,
        type: 'dungeon',
        item: { dungeon, floor }
      } as SearchEntry<{ dungeon: Dungeon, floor: Floor }>);
    }
  }
}