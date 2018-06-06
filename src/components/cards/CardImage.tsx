import { FormControlLabel, Icon, IconButton, Paper, Switch, Tooltip } from '@material-ui/core';
import { action, computed, observable } from 'mobx';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { Canvas } from 'src/components/base';
import { CardImageDescriptor, ImageSize, loadId, makeDefaultScene, setBgVisibility, updateScene } from 'src/renderer/CardImageRenderer';
import { Store } from 'src/store';
import { bound, store } from 'src/utils';
import { OrthographicCamera, WebGLRenderer } from 'three';
import './CardImage.css';

export const ImageHeight = 512;
export const FPS = 30;

const Epsilon = 0.0001;

export interface CardImageProps {
  id: number;
  scale?: number;
}

@inject('store')
@observer
export class CardImage extends React.Component<CardImageProps> {
  @store
  private readonly store: Store;

  @observable
  private time = 0;

  @observable
  private active = true;

  @observable
  private showBg = true;

  @observable.shallow
  private imageDescriptor: CardImageDescriptor | undefined;

  private lastTime = 0;
  private frameId = 0;
  private readonly camera = new OrthographicCamera(-ImageSize / 2, ImageSize / 2, 0, ImageHeight, 0, 10);
  private renderer: WebGLRenderer;

  @computed
  private get defaultScene() { return makeDefaultScene(this.store); }

  @computed
  private get scale() { return this.props.scale || 1; }

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
    return (
      <div className="CardImage-root">
        <Canvas width={ImageSize * this.scale} height={ImageHeight * this.scale} render={this.renderImage} />
        <div className="CardImage-control">
          <IconButton className="CardImage-button" disableRipple={true} onClick={this.toggleActive}>
            <Icon>{this.active ? 'pause' : 'play_arrow'}</Icon>
          </IconButton>
          <div className="CardImage-settings">
            <Icon>settings</Icon>
            <Paper className="CardImage-settings-popup">
              <FormControlLabel
                control={<Switch checked={this.showBg} onChange={this.updateShowBg} />}
                label="background"
              />
            </Paper>
          </div>
          <Tooltip
            title={<span className="CardImage-timeline-moment">{this.time.toFixed(2)} s</span>}
            placement="bottom-start"
          >
            <div className="CardImage-timeline-wrapper">
              <input className="CardImage-timeline" type="range"
                min={0} max={this.imageDescriptor ? this.imageDescriptor.time : 0} step="any"
                value={this.time} onChange={this.timeChanged}
              />
            </div>
          </Tooltip>
        </div>
      </div>
    );
  }

  private resetImage() {
    this.imageDescriptor = undefined;
    loadId(this.store, this.props.id).then(action(
      (descriptor: CardImageDescriptor) => this.imageDescriptor = descriptor
    ));
    this.time = 0;
  }

  @action.bound
  private timeChanged(e: React.ChangeEvent<HTMLInputElement>) {
    const time = Number(e.target.value) || 0;
    this.time = time;
  }

  @action.bound
  private updateShowBg(e: React.ChangeEvent<HTMLInputElement>) {
    this.showBg = e.target.checked;
  }

  @action.bound
  private toggleActive() {
    this.active = !this.active;
  }

  @action.bound
  private tick(time: number) {
    if (!this.lastTime) this.lastTime = time;
    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;

    if (this.active) {
      const animLength = this.imageDescriptor ? this.imageDescriptor.time : 1;
      this.time = ((this.time + dt) % animLength) || 0;
    }
    this.frameId = requestAnimationFrame(this.tick);
  }

  @computed
  private get frameTime() {
    return Math.round(this.time * FPS) / FPS + Epsilon;
  }

  @bound
  private renderImage(canvas: HTMLCanvasElement) {
    if (!this.renderer || this.renderer.context.canvas !== canvas) {
      this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
      this.renderer.sortObjects = false;
      this.camera.position.z = 10;
    }
    const time = this.frameTime;

    if (this.imageDescriptor) {
      updateScene(this.imageDescriptor, time);
    }
    const scene = this.imageDescriptor ? this.imageDescriptor.scene : this.defaultScene;
    setBgVisibility(scene, this.showBg);
    this.renderer.render(scene, this.camera);
  }
}