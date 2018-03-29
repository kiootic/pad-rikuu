import { observable, action, computed, runInAction } from 'mobx';
import { createTransformer } from 'mobx-utils';
import * as Konva from 'konva';
import { JobQueue } from 'app/utils/jobQueue';
import { CardRenderer, CardSize } from 'app/renderer/card';
import { sleep } from 'app/utils';
import { Deferred, DeferredStatus } from 'app/utils/deferred';

export interface CardIcon {
  atlas: string;
  x: number;
  y: number;
}

export class CardDB {
  private renderQueue = new JobQueue();

  @observable
  public isLoaded = false;

  private iconSetData = new Map<number, string>();

  @observable
  private iconSets = new Map<number, Deferred<string>>();

  public getIcon: (id: number) => CardIcon = createTransformer(id => {
    const realId = id >= 100000 ? id - 100000 : id;
    const { id: setId, col, row } = CardRenderer.instance.getIconSet(realId);
    let setTex = this.iconSets.get(setId);
    return setTex && setTex.status === DeferredStatus.Fulfilled ? {
      atlas: setTex.result,
      x: col * CardSize,
      y: row * CardSize,
    } : null;
  });

  public requestIcon(id: number) {
    const realId = id >= 100000 ? id - 100000 : id;
    const { id: setId } = CardRenderer.instance.getIconSet(realId);
    if (this.iconSets.has(setId)) return;

    this.iconSets.set(setId, this.renderQueue.post(async () => {
      const data = await CardRenderer.instance.renderSet(setId);
      this.iconSetData.set(setId, data);
      return fetch(data).then(resp => resp.blob()).then(blob => URL.createObjectURL(blob));
    }));
  }

  public async load() {
    this.isLoaded = true;
  }
}