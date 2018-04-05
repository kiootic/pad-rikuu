import React, { CSSProperties } from 'react';
import { observer } from 'mobx-react';
import { Store } from 'app/store';
import Link from 'next/link';
import css from 'styles/components/cardIcon.scss';
import { IconSize } from 'app/renderer/icon';
import { Canvas } from 'app/components/canvas';

export interface CardProps {
  id: number;
  scale?: number;
  style?: CSSProperties;
  link?: boolean;
}

@observer
export class CardIcon extends React.Component<CardProps> {
  private readonly store = Store.instance;

  componentDidMount() {
    this.store.iconDB.requestIcon(this.props.id);
  }

  componentWillReceiveProps(props: CardProps) {
    this.store.iconDB.requestIcon(props.id);
  }

  renderIcon = (context: CanvasRenderingContext2D, id: number) => {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    const icon = this.store.iconDB.getIcon(id);
    if (!icon) return;

    const size = IconSize * (this.props.scale || 1);
    context.drawImage(icon.atlas, icon.x, icon.y, IconSize, IconSize, 0, 0, size, size);
  }

  render() {
    const size = IconSize * (this.props.scale || 1);
    const style = {
      width: size, height: size,
      ...this.props.style
    };

    let content: JSX.Element;
    if (!this.store.iconDB.getIcon(this.props.id))
      content = <div className={css.loading} style={style}><div /></div>;
    else
      content = <div style={style}>
        <Canvas render={this.renderIcon} width={size} height={size} data={this.props.id} />
      </div>;

    if (this.props.link === false) return content;
    else return <Link href={`/card?id=${this.props.id}`}><a>{content}</a></Link>
  }
}