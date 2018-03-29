import { observable, action } from 'mobx';
import { fetchImage } from 'app/utils';

const assetNames = [
  'card-frame'
];

interface AtlasMetadata<T=any> {
  width: number;
  height: number;
  extra: T;
  textures: Record<string, [number, number]>;
}

export interface Asset {
  image: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
}

export class AssetDB {
  @observable
  public isLoaded = false;

  @observable
  public assets = new Map<string, Asset>();

  @action
  private loadAssets(image: HTMLImageElement, metadata: AtlasMetadata) {
    const { width, height } = metadata;
    for (const key of Object.keys(metadata.textures)) {
      const [x, y] = metadata.textures[key];
      this.assets.set(key, {
        x, y, image,
        width: metadata.width,
        height: metadata.height
      });
    }
  }

  @action
  private onLoaded() {
    this.isLoaded = true;
  }

  private isLoading = false;
  public async load() {
    if (this.isLoaded || this.isLoading) return;
    this.isLoading = true;
    try {
      const data = await Promise.all(assetNames.map(async (name) => {
        const [image, metadata] = await Promise.all([
          fetchImage(`/static/data/assets/${name}.png`),
          fetch(`/static/data/assets/${name}.json`).then(resp => resp.json())
        ]);
        this.loadAssets(image, metadata);
      }));

      this.onLoaded();
    } finally {
      this.isLoading = false;
    }
  }
}