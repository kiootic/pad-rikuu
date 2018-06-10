import * as LocalForage from 'localforage';
import { fetchImage } from 'src/utils';

async function fetchBlobImage(blob: Blob) {
  const blobUrl = URL.createObjectURL(blob);
  try {
    return await fetchImage(blobUrl);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

function storageKey(url: string, bucket: StorageBucket) {
  return `${bucket}:${url}`;
}

export enum StorageBucket {
  Metadata = 'metadata',
  Index = 'index',
  GameData = 'game',
  Icon = 'icon',
  Picture = 'picture'
}

export enum CacheOptions {
  Normal = 'normal',
  Bypass = 'bypass',
  Ignore = 'ignore'
}

const KeyInvalidation = storageKey('/invalidation', StorageBucket.Metadata);
const KeyBaseURL = storageKey('/baseUrl', StorageBucket.Metadata);

export class Storage {
  private _baseUrl: string;
  private invalidatedKeys: Set<string>;

  public async initialize() {
    this.invalidatedKeys = new Set<string>(await LocalForage.getItem<string[]>(KeyInvalidation));
    // tslint:disable-next-line:no-var-require
    this._baseUrl = await LocalForage.getItem<string>(KeyBaseURL) || require('package.json').dataUrl;
  }

  public get baseUrl() { return this._baseUrl; }
  public async setBaseUrl(value: string) {
    await LocalForage.setItem(KeyBaseURL, value);
    this._baseUrl = value;
  }

  public async clear() {
    for (const key of await LocalForage.keys()) {
      if (key === KeyBaseURL) continue;
      await LocalForage.removeItem(key);
    }
  }

  public async setItem<T>(url: string, bucket: StorageBucket, value: T) {
    await LocalForage.setItem<T>(storageKey(url, bucket), value);
  }

  public async getItem<T>(url: string, bucket: StorageBucket) {
    return await LocalForage.getItem<T>(storageKey(url, bucket));
  }

  public async getImage(url: string, bucket: StorageBucket) {
    const blob = await LocalForage.getItem<Blob>(storageKey(url, bucket));
    if (!blob) return undefined;
    return await fetchBlobImage(blob);
  }

  public async invalidateItem(url: string, bucket: StorageBucket) {
    this.invalidatedKeys.add(storageKey(url, bucket));
    await LocalForage.setItem(KeyInvalidation, Array.from(this.invalidatedKeys.values()));
  }

  public async fetchJson<T = any>(url: string, bucket: StorageBucket, cache = CacheOptions.Normal): Promise<T> {
    return await this.fetch(url, bucket, cache).then<T>(resp => resp.json());
  }

  public async fetchImage(url: string, bucket: StorageBucket, cache = CacheOptions.Normal): Promise<HTMLImageElement> {
    const blob = await this.fetch(url, bucket, cache).then(resp => resp.blob());
    return await fetchBlobImage(blob);
  }

  private async fetch(url: string, bucket: StorageBucket, cache: CacheOptions) {
    const key = storageKey(url, bucket);

    if (this.invalidatedKeys.has(key) && cache !== CacheOptions.Ignore)
      cache = CacheOptions.Bypass;

    let data = cache !== CacheOptions.Ignore && await LocalForage.getItem<Blob>(key);
    if (cache === CacheOptions.Normal && data)
      return new Response(data);

    try {
      data = await fetch(this.baseUrl + url).then(resp => resp.blob());
    } catch (e) {
      if (data)
        return new Response(data);
      throw e;
    }

    if (cache !== CacheOptions.Ignore) {
      await LocalForage.setItem(key, data);
      if (this.invalidatedKeys.delete(key))
        await LocalForage.setItem(KeyInvalidation, Array.from(this.invalidatedKeys.values()));
    }
    return new Response(data);
  }
}