import { Store } from 'app/store';
import { Canvas } from 'app/utils/canvas';
import { fetchImage } from 'app/utils';

const IconSize = 102;
const IconPosition = { x: 10, y: 11 };
export const CardSize = 120;

export class CardRenderer {
  private constructor() { }
  public static readonly instance = process.browser ? new CardRenderer() : null;

  private readonly texMap = new Map<number, Promise<HTMLImageElement>>();
  private async getIconTex(setId: number) {
    const texId = setId + 1;

    let tex = this.texMap.get(texId);
    if (!tex) {
      tex = Store.instance.imageDB.resolveImage('cards', texId);
      this.texMap.set(texId, tex);
    }
    return tex;
  }

  public getIconSet(id: number) {
    return {
      id: Math.floor((id - 1) / 100),
      col: ((id - 1) % 10),
      row: (Math.floor((id - 1) / 10) % 10)
    };
  }

  public async renderSet(setId: number) {
    const { assets } = Store.instance.assetDB;

    const iconTex = await this.getIconTex(setId);
    const canvas = Canvas.instance.begin(CardSize * 10, CardSize * 10);

    const cards = Store.instance.gameDB.cards.filter(card => this.getIconSet(card.id).id == setId);

    for (const card of cards) {
      const col = ((card.id - 1) % 10), row = (Math.floor((card.id - 1) / 10) % 10);
      const x = CardSize * col, y = CardSize * row;

      canvas.drawImage({
        image: iconTex,
        x: IconSize * col,
        y: IconSize * row,
        width: IconSize,
        height: IconSize
      }, x + IconPosition.x, y + IconPosition.y);

      if (card.attrs[0] !== -1)
        canvas.drawImage(assets.get(`card-frame-${card.attrs[0]}`), x, y);
      if (card.attrs[1] !== -1)
        canvas.drawImage(assets.get(`card-overlay-${card.attrs[1]}`), x, y);
    }

    const result = await canvas.end();
    return result;
  }
}