import { observable, action } from 'mobx';
import { padStart } from 'lodash';
import { fetchImage } from 'app/utils';

interface Entry {
  key: string;
  isCards: boolean;
  id: number;
  width: number;
  height: number;
  lastUpdate: number;
}

export class ImageDB {
  @observable
  public isLoaded = false;

  @observable
  public version: string = null;

  @observable
  public images: Map<string, Entry> = null;

  public resolve(type: string, id: number) {
    const key = `${type}_${padStart(id.toString(), 3, '0')}`;
    const entry = this.images.get(key);
    if (!entry)
      throw new Error(`no image with id '${key}'`);

    return {
      path: `/static/data/images/${this.version}/${entry.isCards ? 'cards' : 'mons'}/${key}.png`,
      width: entry.width,
      height: entry.height
    };
  }

  public async resolveImage(type: string, id: number) {
    return await fetchImage(this.resolve(type, id).path);
  }

  @action
  private onLoaded(version: string, extlist: Entry[]) {
    this.version = version;
    this.images = new Map(extlist.map<[string, Entry]>(entry => [entry.key, entry]));
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