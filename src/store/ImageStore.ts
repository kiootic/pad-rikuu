import { padStart } from 'lodash';
import { action, observable } from 'mobx';
import { Card } from 'src/models';
import { getIconSet, IconSize, renderIconSet } from 'src/renderer/CardIconRenderer';
import { BaseStore } from 'src/store/BaseStore';
import { CacheOptions, StorageBucket } from 'src/store/Storage';
import { setImmediate, transformer } from 'src/utils';

interface DBEntry {
  readonly key: string;
  readonly isCards: boolean;
  readonly id: number;
  readonly width: number;
  readonly height: number;
  readonly lastUpdate: number;

  readonly frames: number;
  readonly files: string[];
}

export interface Entry {
  readonly width: number;
  readonly height: number;
  readonly frames: number;
  readonly files: string[];
}

type IconImageElement = HTMLImageElement | HTMLCanvasElement;

export interface IconImage {
  image: IconImageElement;
  x: number;
  y: number;
}

export class ImageStore extends BaseStore {
  @observable.shallow
  private readonly images = new Map<string, DBEntry>();

  @observable.shallow
  private readonly icons = new Map<number, false | IconImageElement>();

  public resolve(type: string, id: number): Entry {
    const realId = type === 'mons' ? Card.mainId(id) : id;
    const key = `${type}_${padStart(realId.toString(), 3, '0')}`;
    const entry = this.images.get(key);
    if (!entry)
      throw new Error(`no image with id '${key}'`);

    return {
      width: entry.width,
      height: entry.height,
      frames: entry.frames,
      files: entry.files
    };
  }

  public async fetchImage(entry: Entry, file?: string, cache?: CacheOptions) {
    const path = `/data/images/${file || entry.files[0]}`;
    return await this.root.storage.fetchImage(path, StorageBucket.Picture, cache);
  }

  public async fetchJson(entry: Entry, file?: string, cache?: CacheOptions) {
    const path = `/data/images/${file || entry.files[0]}`;
    return await this.root.storage.fetchJson(path, StorageBucket.Picture, cache);
  }

  @transformer
  public getIcon(id: number) {
    const realId = Card.mainId(id);
    const { id: setId, col, row } = getIconSet(realId);

    if (!this.icons.has(setId))
      this.renderIcons(setId);

    const setTex = this.icons.get(setId);
    if (!setTex) return null;
    else return {
      image: setTex,
      x: col * IconSize,
      y: row * IconSize
    } as IconImage;
  }

  protected async doLoad() {
    const extlist = await this.root.storage.fetchJson('/data/images/extlist.json', StorageBucket.Index);
    this.onLoaded(extlist);
  }

  @action
  private renderIcons(setId: number) {
    this.icons.set(setId, false);
    setImmediate(async () => {
      const storage = this.root.storage;
      const iconUrl = `/data/icons/${setId}.png`;

      let image: IconImageElement | undefined = await storage.getImage(iconUrl, StorageBucket.Icon);
      if (!image) {
        const canvas = await renderIconSet(this.root, setId);
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve));
        await this.root.storage.setItem(iconUrl, StorageBucket.Icon, blob!);
        image = canvas;
      }
      this.icons.set(setId, image);
    });
  }

  @action
  private onLoaded(entries: DBEntry[]) {
    this.images.clear();
    for (const entry of entries)
      this.images.set(entry.key, entry);
  }
}