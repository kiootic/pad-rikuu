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

  @observable.shallow
  private readonly _cardMap = new Map<number, Card>();
  @observable.shallow
  private readonly _skillMap = new Map<number, Skill>();
  @observable.shallow
  private readonly _enemySkillMap = new Map<number, EnemySkill>();

  @computed
  public get cards() { return this._cards; }
  public getCard(id: number) { return this._cardMap.get(id); }

  @computed
  public get skills() { return this._skills; }
  public getSkill(id: number) { return this._skillMap.get(id); }

  @computed
  public get enemySkills() { return this._enemySkills; }
  public getEnemySkill(id: number) { return this._enemySkillMap.get(id); }

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
    const populateMap = <T extends { id: number }>(elements: T[], map: Map<number, T>) => {
      map.clear();
      for (const elem of elements)
        map.set(elem.id, elem);
      return elements;
    };

    this._cards = populateMap(cards, this._cardMap);
    this._skills = populateMap(skills, this._skillMap);
    this._enemySkills = populateMap(enemySkills, this._enemySkillMap);
  }
}