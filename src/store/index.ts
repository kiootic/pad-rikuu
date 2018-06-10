import { computed } from 'mobx';
import { AssetStore } from './AssetStore';
import { BaseStore } from './BaseStore';
import { GameDataStore } from './GameDataStore';
import { ImageStore } from './ImageStore';
import { SearchIndexStore } from './SearchIndexStore';
import { Storage } from './Storage';
import { Updater } from './Updater';

export class Store {
  // tslint:disable:member-ordering
  private readonly _stores: BaseStore[] = [];

  public readonly storage = new Storage();
  public readonly updater = new Updater(this);

  public readonly assets = this.registerStore(AssetStore);
  public readonly gameData = this.registerStore(GameDataStore);
  public readonly images = this.registerStore(ImageStore);
  public readonly searchIndex = this.registerStore(SearchIndexStore);
  public readonly ui: Record<string, any> = {};

  // tslint:enable:member-ordering

  @computed
  public get isLoaded() { return this._stores.every(store => store.isLoaded); }

  @computed
  public get isLoading() { return this._stores.some(store => store.isLoading); }

  public async load(reload = false) {
    await this.storage.initialize();
    await this.updater.initialize();
    await Promise.all(this._stores.map(store => store.load(reload)));
  }

  private registerStore<ChildStore extends BaseStore>(ChildStore: { new(root: Store): ChildStore }): ChildStore {
    const store = new ChildStore(this);
    this._stores.push(store);
    return store;
  }
}