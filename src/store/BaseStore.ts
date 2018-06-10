import { action, computed, observable } from 'mobx';
import { Store } from 'src/store';

export abstract class BaseStore {
  @observable
  private _isLoaded = false;
  @observable
  private _isLoading = false;

  constructor(public readonly root: Store) { }

  @computed
  public get isLoaded() { return this._isLoaded; }

  @computed
  public get isLoading() { return this._isLoading; }

  @action
  public async load(reload = false) {
    if ((this._isLoaded && !reload) || this._isLoading) return;
    this._isLoading = true;

    let ok = false;
    try {
      await this.doLoad();
      ok = true;
    } finally {
      this.loadCompleted(ok);
    }
  }

  protected abstract doLoad(): Promise<void>;

  @action
  private loadCompleted(ok: boolean) {
    if (ok)
      this._isLoaded = true;
    this._isLoading = false;
  }
}