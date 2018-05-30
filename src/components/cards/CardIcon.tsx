import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { AppLink, Canvas } from 'src/components/base';
import { IconSize } from 'src/renderer/CardIconRenderer';
import { Store } from 'src/store';
import { bound, store } from 'src/utils';
import './CardIcon.css';

export interface CardIconProps {
  id: number;
  className?: string;
  scale?: number;
  link?: boolean;
}

@inject('store')
@observer
export class CardIcon extends React.Component<CardIconProps> {
  @store
  private readonly store: Store;

  public render() {
    const scale = this.props.scale || 1;
    const style = {
      width: IconSize * scale,
      height: IconSize * scale,
      transform: `scale(${scale})`,
      transformOrigin: 'top left'
    };

    let content: JSX.Element;
    if (!this.store.images.getIcon(this.props.id))
      content = <div style={style} className={this.props.className}><div className="CardIcon-loading" /></div>;
    else
      content = <div style={style} className={this.props.className}>
        <Canvas width={IconSize} height={IconSize} render={this.renderIcon} />
      </div>;

    if (this.props.link === false) return content;
    else return <AppLink to={`/cards/${this.props.id}`}>{content}</AppLink>;
  }

  @bound
  private renderIcon(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d')!;
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

     const icon = this.store.images.getIcon(this.props.id);
     if (!icon) return;

     context.drawImage(icon.image, icon.x, icon.y, IconSize, IconSize, 0, 0, IconSize, IconSize);
  }
}