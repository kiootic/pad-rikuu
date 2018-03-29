import { observable, action } from 'mobx';
import * as Konva from 'konva';
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

  public async resolve(id: string) {
    const entry = this.images.get(id);
    if (!entry)
      throw new Error(`no image with id '${id}'`);
    return await fetchImage(`/static/data/images/${this.version}/${entry.isCards ? 'cards' : 'mons'}/${id}.png`);
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