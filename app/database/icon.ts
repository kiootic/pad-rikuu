import { observable, action, computed, runInAction } from 'mobx';
import { createTransformer } from 'mobx-utils';
import { JobQueue } from 'app/utils/jobQueue';
import { IconRenderer, IconSize } from 'app/renderer/icon';
import { sleep, fetchImage } from 'app/utils';
import { Deferred, DeferredStatus } from 'app/utils/deferred';

export interface CardIcon {
  atlas: HTMLImageElement;
  x: number;
  y: number;
}

export class IconDB {
  private renderQueue = new JobQueue();

  @observable
  public isLoaded = false;

  private iconSetData = new Map<number, string>();

  @observable
  private iconSets = new Map<number, Deferred<HTMLImageElement>>();

  public getIcon: (id: number) => CardIcon = createTransformer(id => {
    const realId = id >= 100000 ? id - 100000 : id;
    const { id: setId, col, row } = IconRenderer.instance.getIconSet(realId);
    let setTex = this.iconSets.get(setId);
    return setTex && setTex.status === DeferredStatus.Fulfilled ? {
      atlas: setTex.result,
      x: col * IconSize,
      y: row * IconSize,
    } : null;
  });

  public requestIcon(id: number) {
    const realId = id >= 100000 ? id - 100000 : id;
    const { id: setId } = IconRenderer.instance.getIconSet(realId);
    if (this.iconSets.has(setId)) return;

    this.iconSets.set(setId, this.renderQueue.post(async () => {
      const data = await IconRenderer.instance.renderSet(setId);
      const img = await fetchImage(data);
      this.iconSetData.set(setId, data);
      return img;
    }));
  }

  public async load() {
    this.isLoaded = true;
  }
}