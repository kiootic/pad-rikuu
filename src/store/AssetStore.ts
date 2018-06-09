import { action, observable } from 'mobx';
import { BaseStore } from 'src/store/BaseStore';
import { AtlasImage, fetchImage, transformer } from 'src/utils';

const assetRequire = require.context('../assets');
function asset(id: string): [string, AtlasMetadata] {
  return [assetRequire(`./${id}.png`), assetRequire(`./${id}.json`)];
}

const assets = [
  asset('card-bg'),
  asset('card-frames'),
  asset('types'),
  asset('awakenings'),
  asset('icons'),
];

interface AtlasMetadata<T=any> {
  readonly width: number;
  readonly height: number;
  readonly extra: T;
  readonly entries: string[];
}

export class AssetStore extends BaseStore {
  @observable.shallow
  private readonly assets = new Map<string, AtlasImage>();

  @transformer
  public lookup(id: string) {
    return this.assets.get(id)!;
  }

  protected async doLoad() {
    await Promise.all(assets.map(async ([file, metadata]) => {
      const image = await fetchImage(file);
      this.onLoaded(image, metadata);
    }));
  }

  @action
  private onLoaded(image: HTMLImageElement, metadata: AtlasMetadata) {
    const { width, height } = metadata;
    const imgWidth = image.naturalWidth;
    let x = 0;
    let y = 0;
    for (const key of metadata.entries) {
      this.assets.set(key, { image, x, y, width, height });
      x += width;
      if (x >= imgWidth) {
        x = 0;
        y += height;
      }
    }
  }
}