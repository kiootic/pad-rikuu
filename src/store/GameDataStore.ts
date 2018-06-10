import { action, computed, observable } from 'mobx';
import { Card, EnemySkill, Skill } from 'src/models';
import { BaseStore } from 'src/store/BaseStore';
import { StorageBucket } from 'src/store/Storage';

export interface DataVersions {
  cards: number;
  skills: number;
  'enemy-skills': number;
}

export class GameDataStore extends BaseStore {
  @observable
  public versions: DataVersions = {
    cards: 0,
    skills: 0,
    'enemy-skills': 0
  };

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
    const [versions, cards, skills, enemySkills] = await Promise.all([
      this.root.storage.fetchJson<DataVersions>('/game/version.json', StorageBucket.Index),
      this.root.storage.fetchJson<Card[]>('/game/cards.json', StorageBucket.GameData),
      this.root.storage.fetchJson<Skill[]>('/game/skills.json', StorageBucket.GameData),
      this.root.storage.fetchJson<EnemySkill[]>('/game/enemy-skills.json', StorageBucket.GameData),
    ]);
    this.onLoaded(versions, cards, skills, enemySkills);
  }

  @action
  private onLoaded(versions: DataVersions, cards: Card[], skills: Skill[], enemySkills: EnemySkill[]) {
    this.versions = versions;

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