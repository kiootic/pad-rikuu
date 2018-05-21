import { observable, action } from 'mobx';
import { padStart } from 'lodash';
import { fetchImage } from 'app/utils';

interface DBEntry {
  key: string;
  isCards: boolean;
  id: number;
  width: number;
  height: number;
  lastUpdate: number;

  frames: number;
  files: string[];
}

export interface Entry {
  basePath: string;
  width: number;
  height: number;
  frames: number;
  files: string[];
}

export class ImageDB {
  @observable
  public isLoaded = false;

  @observable
  public version: string = null;

  @observable
  private images: Map<string, DBEntry> = null;

  public resolve(type: string, id: number): Entry {
    const realId = type === 'mons' ? id % 100000 : id;
    const key = `${type}_${padStart(realId.toString(), 3, '0')}`;
    const entry = this.images.get(key);
    if (!entry)
      throw new Error(`no image with id '${key}'`);

    return {
      basePath: `/static/data/images/${this.version}/${entry.isCards ? 'cards' : 'mons'}`,
      width: entry.width,
      height: entry.height,
      frames: entry.frames,
      files: entry.files
    };
  }

  public async fetchImage(entry: Entry, file: string = null) {
    const path = `${entry.basePath}/${file || entry.files[0]}`;
    return await fetchImage(path);
  }

  public async fetchFile(entry: Entry, file: string = null) {
    const path = `${entry.basePath}/${file || entry.files[0]}`;
    return await fetch(path).then(resp => resp.json());
  }

  @action
  private onLoaded(version: string, extlist: DBEntry[]) {
    this.version = version;
    this.images = new Map(extlist.map<[string, DBEntry]>(entry => [entry.key, entry]));
    this.isLoaded = true;
  }

  private isLoading = false;
  public async load() {
    if (this.isLoaded || this.isLoading) return;
    this.isLoading = true;
    try {
      const version = await fetch('/static/data/images/current').then(resp => resp.text());
      const extlist = await fetch(`/static/data/images/${version}/extlist.json`).then(resp => resp.json());
      this.onLoaded(version, extlist);
    } finally {
      this.isLoading = false;
    }
  }
}