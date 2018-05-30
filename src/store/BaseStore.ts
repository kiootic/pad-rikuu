import { action, computed, observable } from 'mobx';
import { Store } from 'src/store';

export abstract class BaseStore {
  @observable
  private _isLoaded = false;
  private _isLoading = false;

  constructor(public readonly root: Store) { }

  @computed
  public get isLoaded() { return this._isLoaded; }

  @action
  public async load() {
    if (this._isLoaded || this._isLoading) return;
    this._isLoading = true;
    try {
      await this.doLoad();

      this.loadCompleted();
    } finally {
      this._isLoading = false;
    }
  }

  protected abstract doLoad(): Promise<void>;

  @action
  private loadCompleted() { this._isLoaded = true; }
}