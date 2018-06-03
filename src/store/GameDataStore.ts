import { action, computed, observable } from 'mobx';
import { Card, EnemySkill, Skill } from 'src/models';
import { BaseStore } from 'src/store/BaseStore';

export class GameDataStore extends BaseStore {
  @observable.shallow
  private _cards: Card[] = [];
  @observable.shallow
  private _skills: Skill[] = [];
  @observable.shallow
  private _enemySkills: EnemySkill[] = [];

  @computed
  public get cards() { return this._cards; }

  @computed
  public get skills() { return this._skills; }

  @computed
  public get enemySkills() { return this._enemySkills; }

  protected async doLoad() {
    const [cards, skills, enemySkills] = await Promise.all([
      fetch('/data/game/cards.json').then<Card[]>(resp => resp.json()),
      fetch('/data/game/skills.json').then<Skill[]>(resp => resp.json()),
      fetch('/data/game/enemy-skills.json').then<EnemySkill[]>(resp => resp.json())
    ]);
    this.onLoaded(cards, skills, enemySkills);
  }

  @action
  private onLoaded(cards: Card[], skills: Skill[], enemySkills: EnemySkill[]) {
    this._cards = cards;
    this._skills = skills;
    this._enemySkills = enemySkills;
  }
}