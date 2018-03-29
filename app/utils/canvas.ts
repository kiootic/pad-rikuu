
export interface Texture {
  image: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
}

export class Canvas {
  private readonly canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;

  private texMap = new Map<HTMLImageElement, WebGLTexture>();

  public static readonly instance = new Canvas();
  private constructor() {
    if (process.browser) {
      this.canvas = document.createElement('canvas');
      this.context = this.canvas.getContext('2d');
    }
  }

  public begin(width: number, height: number) {
    if (this.width != width) {
      this.width = width;
      this.canvas.width = width;
    }
    if (this.height != height) {
      this.height = height;
      this.canvas.height = height;
    }
    this.context.clearRect(0, 0, this.width, this.height);
    return this;
  }

  public drawImage(tex: Texture, x?: number, y?: number, width?: number, height?: number) {
    this.context.drawImage(tex.image,
      tex.x, tex.y, tex.width, tex.height,
      x || 0, y || 0, width || tex.width, height || tex.height);
    return this;
  }

  public async end() {
    return await new Promise<string>(resolve => {
      this.canvas.toBlob(blob => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    });
  }
}