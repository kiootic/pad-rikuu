import { fetchImage } from 'src/utils';

async function fetchBlobImage(blob: Blob) {
  const blobUrl = URL.createObjectURL(blob);
  try {
    return await fetchImage(blobUrl);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

export enum CacheOptions {
  Normal = 'normal',
  Bypass = 'bypass',
  Ignore = 'ignore'
}

const InvalidatedPaths = 'invalidatedPaths';
const BaseURL = 'baseURL';

export class Storage {
  private cache: Cache | undefined;
  private origin: string;
  private invalidatedPaths: Set<string>;
  private _baseUrl: string;

  public async initialize() {
    this.cache = window.caches && await caches.open('data');
    this.origin = new URL(process.env.PUBLIC_URL!, window.location.origin).toString();
    this.invalidatedPaths = new Set<string>(JSON.parse(localStorage[InvalidatedPaths] || '[]'));
    // tslint:disable-next-line:no-var-require
    this._baseUrl = localStorage[BaseURL] || require('package.json').dataUrl;
  }

  public get baseUrl() { return this._baseUrl; }
  public set baseUrl(value: string) { localStorage[BaseURL] = (this._baseUrl = value); }

  public async clear() {
    if (window.caches)
      await window.caches.delete('data');
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('data:'))
        localStorage.removeItem(key);
    }
  }

  public async setJson<T>(key: string, value: T) {
    localStorage[`data:${key}`] = JSON.stringify(value);
  }

  public async getJson<T>(key: string) {
    const data = localStorage[`data:${key}`];
    if (!data) return undefined;
    return JSON.parse(data) as T;
  }

  public async invalidateResource(path: string) {
    this.invalidatedPaths.add(path);
    localStorage[InvalidatedPaths] = JSON.stringify(Array.from(this.invalidatedPaths.values()));
  }

  public async fetchJson<T = any>(path: string, cache = CacheOptions.Normal): Promise<T> {
    return await this.fetch(path, cache).then<T>(resp => resp.json());
  }

  public async fetchImage(path: string, cache = CacheOptions.Normal): Promise<HTMLImageElement> {
    const blob = await this.fetch(path, cache).then(resp => resp.blob());
    return await fetchBlobImage(blob);
  }

  private async fetch(path: string, opt: CacheOptions) {
    const cacheUrl = new URL(path, this.origin).toString();

    if (this.invalidatedPaths.has(path) && opt !== CacheOptions.Ignore)
      opt = CacheOptions.Bypass;

    let resp = opt !== CacheOptions.Ignore && this.cache && await this.cache.match(cacheUrl);
    if (opt === CacheOptions.Normal && resp)
      return resp;

    try {
      const fetchResp = await fetch(new URL(path, this._baseUrl).toString());
      if (fetchResp.ok)
        resp = fetchResp;
      else
        throw fetchResp;
    } catch (e) {
      if (resp)
        return resp;
      throw e;
    }

    if (opt !== CacheOptions.Ignore) {
      if (this.cache)
        await this.cache.put(cacheUrl, resp.clone());
      if (this.invalidatedPaths.delete(path))
        localStorage[InvalidatedPaths] = JSON.stringify(Array.from(this.invalidatedPaths.values()));
    }
    return resp;
  }
}