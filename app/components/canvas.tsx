import React from 'react';
import { observer } from 'mobx-react';
import { observable, action, autorun, IReactionDisposer } from 'mobx';

export interface CanvasProps<T> {
  width: number;
  height: number;
  data?: T;
  render: (context: CanvasRenderingContext2D, data?: T) => void;
}

export interface AnimatedCanvasProps {
  width: number;
  height: number;
  fps?: number;
  render: (canvas: HTMLCanvasElement, time: number) => void;
}

@observer
export class Canvas<T> extends React.Component<CanvasProps<T>> {
  performRender() {
    const canvas = this.refs.canvas as HTMLCanvasElement;
    this.props.render(canvas.getContext('2d'), this.props.data);
  }

  componentDidMount() {
    this.performRender();
  }

  componentDidUpdate() {
    this.performRender();
  }

  render() {
    return <canvas ref='canvas' width={this.props.width} height={this.props.height} />;
  }
}

@observer
export class AnimatedCanvas extends React.Component<AnimatedCanvasProps> {
  @observable
  private time: number;
  private frameId: number;

  private lastRender = 0;
  private performRender = () => {
    const time = this.time || 0;
    const fps = this.props.fps || 10;
    const interval = 1000 / fps;

    const elapsed = time - this.lastRender;
    if (elapsed > interval) {
      this.lastRender = time - (elapsed % interval);

      const canvas = this.refs.canvas as HTMLCanvasElement;
      this.props.render(canvas, time);
    }
  }

  private dispose: IReactionDisposer = autorun(this.performRender);

  @action.bound
  private tick(time: number) {
    this.time = time;
    this.frameId = requestAnimationFrame(this.tick);
  }

  componentDidMount() {
    this.frameId = requestAnimationFrame(this.tick);
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.frameId);
    this.dispose();
  }

  render() {
    return <canvas ref='canvas' width={this.props.width} height={this.props.height} />;
  }
}