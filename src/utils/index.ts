import { range } from 'lodash';
import { action, observable } from 'mobx';

export function fetchImage(url: string) {
  const img = new Image();
  return new Promise<HTMLImageElement>((resolve, reject) => {
    img.onload = e => resolve(img);
    img.onerror = e => reject(e);
    img.src = url;
  });
}

export function setImmediate(fn: () => void) {
  setTimeout(action(fn), 0);
}

let pixelRatio: { ratio: number };
export function getDevicePixelRatio() {
  if (!pixelRatio) {
    pixelRatio = observable({ ratio: window.devicePixelRatio });
    setInterval(action(() => pixelRatio.ratio = window.devicePixelRatio), 5000);
  }
  return pixelRatio.ratio;
}

export function parseFlags<T extends number>(flags: number): T[] {
  // tslint:disable-next-line:no-bitwise
  return range(0, 32).filter(i => flags & (1 << i)) as T[];
}

export * from './decorators';
export * from './AtlasImage';