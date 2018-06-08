import { Typography } from '@material-ui/core';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { AppLink, Asset, Canvas, HoverPopup } from 'src/components/base';
import { IconSize } from 'src/renderer/CardIconRenderer';
import { Store } from 'src/store';
import { bound, getDevicePixelRatio, store } from 'src/utils';
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
    const scale = (this.props.scale || 1) * 1 / getDevicePixelRatio();
    const style = {
      width: IconSize * scale,
      height: IconSize * scale,
    };

    let content: JSX.Element;
    if (!this.store.images.getIcon(this.props.id))
      content = <div style={style} className={this.props.className}><div className="CardIcon-loading" /></div>;
    else
      content = <div style={style} className={this.props.className}>
        <Canvas className="CardIcon-canvas" width={IconSize} height={IconSize} render={this.renderIcon} />
      </div>;

    const card = this.store.gameData.getCard(this.props.id);
    if (this.props.link === false) return content;
    else {
      const link = <AppLink to={`/cards/${this.props.id}`}>{content}</AppLink>;
      if (!card) return link;

      return (
        <HoverPopup header={link}>
          <Typography className="CardIcon-info">
            <span className="CardIcon-info-header">
              <Typography variant="caption" className="CardIcon-info-no">No. {card.id}</Typography>
              <span>{
                card.types.filter(type => type !== -1)
                  .map((type, i) => <Asset assetId={`type-${type}`} key={i} />)
              }</span>
            </span>
            {card.name}
          </Typography>
        </HoverPopup>
      );
    }
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