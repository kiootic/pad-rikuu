import { action, computed, observable } from 'mobx';
import { Card, Skill } from 'src/models';
import { BaseStore } from 'src/store/BaseStore';

export class GameDataStore extends BaseStore {
  @observable.shallow
  private _cards: Card[] = [];
  @observable.shallow
  private _skills: Skill[] = [];

  @computed
  public get cards() { return this._cards; }

  @computed
  public get skills() { return this._skills; }

  protected async doLoad() {
    const [cards, skills] = await Promise.all([
      fetch('/data/game/cards.json').then<Card[]>(resp => resp.json()),
      fetch('/data/game/skills.json').then<Skill[]>(resp => resp.json())
    ]);
    this.onLoaded(cards, skills);
  }

  @action
  private onLoaded(cards: Card[], skills: Skill[]) {
    this._cards = cards;
    this._skills = skills;
  }
}