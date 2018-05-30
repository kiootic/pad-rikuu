import { action, computed, observable } from 'mobx';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { Canvas } from 'src/components/base';
import { CardImageDescriptor, ImageSize, loadId, makeDefaultScene, updateScene } from 'src/renderer/CardImageRenderer';
import { Store } from 'src/store';
import { bound, store } from 'src/utils';
import { OrthographicCamera, WebGLRenderer } from 'three';
import './CardIcon.css';

export const ImageHeight = 512;
export const FPS = 30;

const Epsilon = 0.0001;

export interface CardImageProps {
  id: number;
}

@inject('store')
@observer
export class CardImage extends React.Component<CardImageProps> {
  @store
  private readonly store: Store;

  @observable
  private time = 0;

  private imageDescriptor: CardImageDescriptor | undefined;

  private lastTime = 0;
  private frameId = 0;
  private readonly camera = new OrthographicCamera(-ImageSize / 2, ImageSize / 2, 0, ImageHeight, 0, 10);
  private renderer: WebGLRenderer;

  @computed
  private get defaultScene() { return makeDefaultScene(this.store); }

  public componentDidMount() {
    this.frameId = requestAnimationFrame(this.tick);
    this.resetImage();
  }

  public componentWillUnmount() {
    cancelAnimationFrame(this.frameId);
  }

  @action
  public componentDidUpdate(prev: CardImageProps) {
    if (prev.id !== this.props.id)
      this.resetImage();
  }

  public render() {
    return <Canvas width={ImageSize} height={ImageHeight} render={this.renderImage} />;
  }

  private resetImage() {
    this.imageDescriptor = undefined;
    loadId(this.store, this.props.id).then(descriptor => this.imageDescriptor = descriptor);
    this.time = 0;
  }

  @action.bound
  private tick(time: number) {
    if (!this.lastTime) this.lastTime = time;
    const dt = time - this.lastTime;
    this.lastTime = time;

    this.time += dt;
    this.frameId = requestAnimationFrame(this.tick);
  }

  @computed
  private get frameTime() {
    return Math.round(this.time / 1000 * FPS) / FPS + Epsilon;
  }

  @bound
  private renderImage(canvas: HTMLCanvasElement) {
    if (!this.renderer || this.renderer.context.canvas !== canvas) {
      this.renderer = new WebGLRenderer({ canvas, antialias: true });
      this.renderer.sortObjects = false;
      this.camera.position.z = 10;
    }
    const time = this.frameTime;

    if (this.imageDescriptor)
      updateScene(this.imageDescriptor, time);
    this.renderer.render(this.imageDescriptor ? this.imageDescriptor.scene : this.defaultScene, this.camera);
  }
}