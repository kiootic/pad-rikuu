import { action, computed, observable } from 'mobx';
import { Card, Dungeon, DungeonData, EnemySkill, Skill } from 'src/models';
import { BaseStore } from 'src/store/BaseStore';

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
  private _dungeons: Dungeon[] = [];
  @observable.shallow
  private _waves: DungeonData[] = [];

  @observable.shallow
  private readonly _cardMap = new Map<number, Card>();
  @observable.shallow
  private readonly _skillMap = new Map<number, Skill>();
  @observable.shallow
  private readonly _enemySkillMap = new Map<number, EnemySkill>();
  @observable.shallow
  private readonly _dungeonMap = new Map<number, Dungeon>();

  @computed
  public get cards() { return this._cards; }
  public getCard(id: number) { return this._cardMap.get(id); }

  @computed
  public get skills() { return this._skills; }
  public getSkill(id: number) { return this._skillMap.get(id); }

  @computed
  public get enemySkills() { return this._enemySkills; }
  public getEnemySkill(id: number) { return this._enemySkillMap.get(id); }

  @computed
  public get dungeons() { return this._dungeons; }
  public getDungeon(id: number) { return this._dungeonMap.get(id); }

  @computed
  public get waves() { return this._waves; }

  protected async doLoad() {
    const [versions, cards, skills, enemySkills, dungeons, waves] = await Promise.all([
      this.root.storage.fetchJson<DataVersions>('game/version.json'),
      this.root.storage.fetchJson<Card[]>('game/cards.json'),
      this.root.storage.fetchJson<Skill[]>('game/skills.json'),
      this.root.storage.fetchJson<EnemySkill[]>('game/enemy-skills.json'),
      this.root.storage.fetchJson<Dungeon[]>('game/dungeons.json'),
      this.root.storage.fetchJson<DungeonData[]>('game/waves.json'),
    ]);
    this.onLoaded(versions, cards, skills, enemySkills, dungeons, waves);
  }

  @action
  private onLoaded(
    versions: DataVersions,
    cards: Card[], skills: Skill[], enemySkills: EnemySkill[],
    dungeons: Dungeon[], waves: DungeonData[]
  ) {
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
    this._dungeons = populateMap(dungeons, this._dungeonMap);
    this._waves = waves;
  }
}