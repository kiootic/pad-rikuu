import { Icon, Typography } from '@material-ui/core';
import { maxBy, minBy } from 'lodash';
import { computed } from 'mobx';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { AppLinkButton, HoverPopup } from 'src/components/base';
import { CardDetails } from 'src/components/cards/CardDetails';
import { EnemyDetails } from 'src/components/enemies/EnemyDetails';
import { Card } from 'src/models';
import { Store } from 'src/store';
import { store } from 'src/utils';
import './CardInfo.css';

@inject('store')
@observer
export class CardInfo extends React.Component<RouteComponentProps<{ type: string, id: string }>> {
  @store
  private readonly store: Store;

  @computed
  private get id() {
    return Number(this.props.match.params.id);
  }

  @computed
  private get type() {
    return this.props.match.params.type;
  }

  @computed
  private get cardSection() {
    return Card.section(this.id);
  }

  @computed
  private get cardMainId() {
    return Card.mainId(this.id);
  }

  @computed
  private get card() {
    return this.store.gameData.cards.find(card => card.id === this.cardMainId);
  }

  @computed
  private get cardList() {
    return this.store.gameData.cards.filter(card => !card.isEmpty && Card.section(card) === this.cardSection);
  }

  @computed
  private get alternativeCards() {
    return this.store.gameData.cards.filter(card => !card.isEmpty && Card.mainId(card) === this.cardMainId);
  }

  public componentDidUpdate(prevProps: RouteComponentProps<{ id: string }>) {
    if (this.props.history.action === 'PUSH' && this.props.location !== prevProps.location) {
      window.scrollTo(0, 0);
    }
  }

  public render() {
    const thisCard = this.card;
    if (!thisCard) return;

    const prev = maxBy(this.cardList.filter(card => card.id < this.id), card => card.id);
    const next = minBy(this.cardList.filter(card => card.id > this.id), card => card.id);

    const linkButton = (type: string, card: Card) => {
      return (
        <AppLinkButton to={`/${type}/${card.id}`} disabled={this.type === type && this.id === card.id}>
          No. {card.id} - {card.name}
        </AppLinkButton>
      );
    };

    return (
      <main className="CardInfo-root">
        <div className="CardInfo-content">
          {
            this.type === 'cards' ?
              <CardDetails id={this.id} className="CardInfo-details" /> :
              <EnemyDetails id={this.id} className="CardInfo-details" />
          }

          <HoverPopup anchor="left" header={<Icon>settings</Icon>} className="CardInfo-options">
            <ul className="CardInfo-option-list">
              <li className="CardInfo-option-title"><Typography variant="caption" component="label">Card info</Typography></li>
              <li>{linkButton('cards', thisCard)}</li>
              <li className="CardInfo-option-title"><Typography variant="caption" component="label">Enemy info</Typography></li>
              {this.alternativeCards.map(card => <li key={card.id}>{linkButton('enemies', card)}</li>)}
            </ul>
          </HoverPopup>
        </div>

        {
          this.type === 'cards' ? <>
            <AppLinkButton disabled={!prev} to={`/cards/${prev && prev.id}`} replace={true} className="CardInfo-prev">
              <Icon>chevron_left</Icon>
            </AppLinkButton>
            <AppLinkButton disabled={!next} to={`/cards/${next && next.id}`} replace={true} className="CardInfo-next">
              <Icon>chevron_right</Icon>
            </AppLinkButton>
          </> : null
        }
      </main>
    );
  }
}