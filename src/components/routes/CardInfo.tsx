import { Icon } from '@material-ui/core';
import { maxBy, minBy } from 'lodash';
import { computed } from 'mobx';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { AppLinkButton } from 'src/components/base';
import { Card } from 'src/models';
import { Store } from 'src/store';
import { store } from 'src/utils';
import { CardDetails } from '../cards/CardDetails';
import './CardInfo.css';

@inject('store')
@observer
export class CardInfo extends React.Component<RouteComponentProps<{ id: string }>> {
  @store
  private readonly store: Store;

  @computed
  private get id() {
    return Number(this.props.match.params.id);
  }

  @computed
  private get cardSection() {
    return Card.section(this.id);
  }

  @computed
  private get cardList() {
    return this.store.gameData.cards.filter(card => !card.isEmpty && Card.section(card) === this.cardSection);
  }

  public componentDidUpdate(prevProps: RouteComponentProps<{ id: string }>) {
    if (this.props.history.action === 'PUSH' && this.props.location !== prevProps.location) {
      window.scrollTo(0, 0);
    }
  }

  public render() {
    const prev = maxBy(this.cardList.filter(card => card.id < this.id), card => card.id);
    const next = minBy(this.cardList.filter(card => card.id > this.id), card => card.id);

    return (
      <main className="CardInfo-root">
        <CardDetails id={this.id} className="CardInfo-details" />
        <AppLinkButton
          disabled={!prev} to={`/cards/${prev ? prev.id : this.id}`} replace={true}
          disableRipple={true} className="CardInfo-prev"
        >
          <Icon>chevron_left</Icon>
        </AppLinkButton>
        <AppLinkButton
          disabled={!next} to={`/cards/${next ? next.id : this.id}`} replace={true}
          disableRipple={true} className="CardInfo-next"
        >
          <Icon>chevron_right</Icon>
        </AppLinkButton>
      </main>
    );
  }
}