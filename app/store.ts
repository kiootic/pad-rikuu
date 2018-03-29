import { observable, action, configure, computed } from 'mobx';
import { GameDB } from 'app/database/game';
import { AssetDB } from 'app/database/assets';
import { ImageDB } from 'app/database/image';
import { CardDB } from 'app/database/card';

configure({ enforceActions: true });

let store: Store;
export class Store {
  private constructor() { }
  public static get instance(): Store {
    return store || (store = new Store());
  }

  public gameDB = new GameDB();
  public assetDB = new AssetDB();
  public imageDB = new ImageDB();
  public cardDB = new CardDB();

  @computed
  public get isLoaded() {
    return this.gameDB.isLoaded && this.assetDB.isLoaded && this.imageDB.isLoaded;
  }

  @action.bound
  public async load() {
    await Promise.all([
      this.gameDB.load(),
      this.assetDB.load(),
      this.imageDB.load()
    ]);
  }
}