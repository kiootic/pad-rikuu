import React, { CSSProperties } from 'react';
import { observer } from 'mobx-react';
import { Store } from 'app/store';
import Link from 'next/link';
import css from 'styles/components/card.scss';

export interface CardProps {
  id: number;
  style: CSSProperties;
}

@observer
export class Card extends React.Component<CardProps> {
  private readonly store = Store.instance;

  componentDidMount() {
    this.store.cardDB.requestIcon(this.props.id);
  }

  componentWillReceiveProps(props: CardProps) {
    this.store.cardDB.requestIcon(this.props.id);
  }

  render() {
    const icon = this.store.cardDB.getIcon(this.props.id);

    let content: JSX.Element;
    if (!icon)
      content = <div className={css.loading} style={this.props.style}><div /></div>;
    else
      content = <img src={icon.atlas} style={{
        ...this.props.style,
        objectFit: 'none',
        objectPosition: `-${icon.x}px -${icon.y}px`
      }} />;

    return <Link><a href={`/card?id=${this.props.id}`}>{content}</a></Link>
  }
}