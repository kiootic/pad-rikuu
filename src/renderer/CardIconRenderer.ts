import { Store } from 'src/store';
import { AtlasImage } from 'src/utils';

const ImageSize = 102;
const ImagePosition = { x: 10, y: 11 };
export const IconSize = 120;

export interface IconSet {
  readonly id: number;
  readonly col: number;
  readonly row: number;
}

export function getIconSet(id: number): IconSet {
  return {
    id: Math.floor((id - 1) / 100),
    col: ((id - 1) % 10),
    row: (Math.floor((id - 1) / 10) % 10)
  };
}

export async function renderIconSet(store: Store, setId: number) {
  const texId = setId + 1;
  const iconTex = await store.images.fetchImage(store.images.resolve('cards', texId));

  const canvas = document.createElement('canvas');
  canvas.width = IconSize * 10;
  canvas.height = IconSize * 10;
  const context = canvas.getContext('2d')!;

  function drawImage(tex: AtlasImage, x?: number, y?: number, width?: number, height?: number) {
    if (!tex) return;
    context.drawImage(tex.image,
      tex.x, tex.y, tex.width, tex.height,
      x || 0, y || 0, width || tex.width, height || tex.height);
  }

  const cards = store.gameData.cards.filter(card => getIconSet(card.id).id === setId);

  for (const card of cards) {
    const col = ((card.id - 1) % 10);
    const row = (Math.floor((card.id - 1) / 10) % 10);
    const x = IconSize * col;
    const y = IconSize * row;

    drawImage({
      image: iconTex,
      x: ImageSize * col,
      y: ImageSize * row,
      width: ImageSize,
      height: ImageSize
    }, x + ImagePosition.x, y + ImagePosition.y);

    if (card.attrs[0] !== -1)
      drawImage(store.assets.lookup(`card-frame-${card.attrs[0]}`), x, y);
    if (card.attrs[1] !== -1)
      drawImage(store.assets.lookup(`card-overlay-${card.attrs[1]}`), x, y);
  }

  const result = await new Promise<string>(resolve => {
    canvas.toBlob(blob => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob!);
    });
  });
  return result;
}