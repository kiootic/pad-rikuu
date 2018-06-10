import { action, computed, observable } from 'mobx';
import { Store } from 'src/store';
import { DataVersions } from 'src/store/GameDataStore';
import { DBEntry } from 'src/store/ImageStore';
import { CacheOptions } from 'src/store/Storage';
import { AppNotifications } from '../components/app/AppNotifications';

const LastUpdated = 'lastUpdated';

export class Updater {
  @observable
  public lastUpdated: Date;

  @observable
  public working = false;

  @observable
  private outdatedPaths: string[] = [];

  @computed
  public get updateAvailable() { return this.outdatedPaths.length > 0; }

  constructor(private readonly store: Store) {
  }

  public async initialize() {
    const lastUpdated = localStorage[LastUpdated];
    if (lastUpdated) {
      this.lastUpdated = new Date(lastUpdated);
    } else {
      this.lastUpdated = new Date();
      localStorage[LastUpdated] = this.lastUpdated.toISOString();
    }
  }

  @action
  public async checkUpdate() {
    if (this.working) return;

    const storage = this.store.storage;
    const outdated = new Set<string>();
    this.working = true;

    try {
      const versions = await storage.fetchJson<DataVersions>('game/version.json', CacheOptions.Ignore);
      for (const dataKey of Object.keys(versions)) {
        if (versions[dataKey] !== this.store.gameData.versions[dataKey]) {
          outdated.add(`game/${dataKey}.json`);
          outdated.add('game/version.json');
        }
      }

      const extlist = await storage.fetchJson<DBEntry[]>('images/extlist.json', CacheOptions.Ignore);
      for (const entry of extlist) {
        const oldEntry = this.store.images.entries.get(entry.key);
        if (!oldEntry || oldEntry.lastUpdate !== entry.lastUpdate) {
          for (const file of entry.files)
            outdated.add(`images/${file}`);
          outdated.add('images/extlist.json');
        }
        if (oldEntry && oldEntry.lastUpdate !== entry.lastUpdate) {
          for (const file of oldEntry.files)
            outdated.add(`images/${file}`);
          outdated.add('images/extlist.json');
        }
      }
    } catch (e) {
      action(() => this.working = false)();
      AppNotifications.show({
        message: 'Failed to check update'
      });
      throw e;
    }

    action(() => {
      this.outdatedPaths = Array.from(outdated.values());
      this.working = false;
    })();

    if (this.updateAvailable) {
      AppNotifications.show({
        message: 'Data update available',
        action: {
          content: 'Update',
          fn: this.updateData
        }
      });
    } else {
      await action(async () => this.lastUpdated = new Date())();
      localStorage[LastUpdated] = this.lastUpdated.toISOString();
    }
  }

  @action.bound
  public async updateData() {
    if (this.working) return;
    this.working = true;

    try {
      for (const path of this.outdatedPaths) {
        await this.store.storage.invalidateResource(path);
      }
      if (this.outdatedPaths.length > 0) {
        await this.store.load(true);

        await action(async () => this.lastUpdated = new Date())();
        localStorage[LastUpdated] = this.lastUpdated.toISOString();
        AppNotifications.show({
          message: 'Data updated'
        });
      }
    } finally {
      action(() => {
        this.outdatedPaths.length = 0;
        this.working = false;
      })();
    }
  }
}