import * as LocalForage from 'localforage';
import { fetchImage } from 'src/utils';

export enum StorageBucket {
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

const KeyInvalidation = 'metadata:invalidation';

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

export class Storage {
  private readonly baseUrl = process.env.PUBLIC_URL!;

  private invalidatedKeys: Set<string>;

  public async initialize() {
    this.invalidatedKeys = new Set<string>(await LocalForage.getItem<string[]>(KeyInvalidation));
    Object.assign(window, { LocalForage });
  }

  public async clear() {
    await LocalForage.clear();
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
    let data: Blob;

    if (this.invalidatedKeys.has(key) && cache !== CacheOptions.Ignore)
      cache = CacheOptions.Bypass;

    if (cache === CacheOptions.Normal) {
      data = await LocalForage.getItem<Blob>(key);
      if (data)
        return new Response(data);
    }

    data = await fetch(this.baseUrl + url).then(resp => resp.blob());

    if (cache !== CacheOptions.Ignore) {
      await LocalForage.setItem(key, data);
      if (this.invalidatedKeys.delete(key))
        await LocalForage.setItem(KeyInvalidation, Array.from(this.invalidatedKeys.values()));
    }
    return new Response(data);
  }
}