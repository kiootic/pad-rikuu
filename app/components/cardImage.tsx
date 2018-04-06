import React from 'react';
import { observer } from 'mobx-react';
import { observable, action, computed, reaction, autorun } from 'mobx';
import { Store } from 'app/store';
import { AnimatedCanvas } from 'app/components/canvas';
import { Deferred } from 'app/utils/deferred';
import { fromPromise } from 'mobx-utils';
import { fetchImage } from 'app/utils';
import { CardImageRenderer } from 'app/renderer/cardImage';

export interface CardImageProps {
  id: number;
}

@observer
export class CardImage<T> extends React.Component<CardImageProps> {
  private renderer: CardImageRenderer;

  componentDidMount() {
    autorun(() => {
      this.renderer = new CardImageRenderer(this.props.id);
    });
  }

  render() {
    return <AnimatedCanvas width={640} height={512} fps={40}
      render={(context, time) => this.renderer.render(context, time)} />
  }
}