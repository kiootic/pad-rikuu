import { action, computed, observable } from 'mobx';
import { Store } from 'src/store';
import { DataVersions } from 'src/store/GameDataStore';
import { DBEntry } from 'src/store/ImageStore';
import { CacheOptions, StorageBucket } from 'src/store/Storage';
import { AppNotifications } from '../components/app/AppNotifications';

export class Updater {
  @observable
  public lastUpdated: Date;

  @observable
  public working = false;

  @observable
  private outdatedKeys: Array<[string, StorageBucket]> = [];

  @computed
  public get updateAvailable() { return this.outdatedKeys.length > 0; }

  constructor(private readonly store: Store) {
  }

  public async initialize() {
    const lastCheck = await this.store.storage.getItem<string>('/last-update', StorageBucket.Metadata);
    if (lastCheck) {
      this.lastUpdated = new Date(lastCheck);
    } else {
      this.lastUpdated = new Date();
      await this.store.storage.setItem('/last-updated', StorageBucket.Metadata, this.lastUpdated.toISOString());
    }
  }

  @action
  public async checkUpdate() {
    if (this.working) return;

    const storage = this.store.storage;
    const outdated = new Set<[string, StorageBucket]>();
    this.working = true;

    try {
      const versions = await storage.fetchJson<DataVersions>(
        '/game/version.json', StorageBucket.Index, CacheOptions.Ignore
      );
      for (const dataKey of Object.keys(versions)) {
        if (versions[dataKey] !== this.store.gameData.versions[dataKey]) {
          outdated.add([`/game/${dataKey}.json`, StorageBucket.GameData]);
          outdated.add(['/game/version.json', StorageBucket.Index]);
        }
      }

      const extlist = await storage.fetchJson<DBEntry[]>(
        '/images/extlist.json', StorageBucket.Index, CacheOptions.Ignore
      );
      for (const entry of extlist) {
        const oldEntry = this.store.images.entries.get(entry.key);
        if (!oldEntry || oldEntry.lastUpdate !== entry.lastUpdate) {
          for (const file of entry.files)
            outdated.add([`/images/${file}`, StorageBucket.Picture]);
          outdated.add(['/images/extlist.json', StorageBucket.Index]);
        }
        if (oldEntry && oldEntry.lastUpdate !== entry.lastUpdate) {
          for (const file of oldEntry.files)
            outdated.add([`/images/${file}`, StorageBucket.Picture]);
          outdated.add(['/images/extlist.json', StorageBucket.Index]);
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
      this.outdatedKeys = Array.from(outdated.values());
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
      await this.store.storage.setItem('/last-updated', StorageBucket.Metadata, this.lastUpdated.toISOString());
    }
  }

  @action.bound
  public async updateData() {
    if (this.working) return;
    this.working = true;

    try {
      for (const [url, bucket] of this.outdatedKeys) {
        await this.store.storage.invalidateItem(url, bucket);
      }
      if (this.outdatedKeys.length > 0) {
        await this.store.load(true);

        await action(async () => this.lastUpdated = new Date())();
        await this.store.storage.setItem('/last-updated', StorageBucket.Metadata, this.lastUpdated.toISOString());
        AppNotifications.show({
          message: 'Data updated'
        });
      }
    } finally {
      action(() => {
        this.outdatedKeys.length = 0;
        this.working = false;
      })();
    }
  }
}