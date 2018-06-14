import { Icon, IconButton, MenuItem, Typography } from '@material-ui/core';
import { maxBy, minBy } from 'lodash';
import { action, computed, observable } from 'mobx';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { Link, RouteComponentProps } from 'react-router-dom';
import { AppHeader } from 'src/components/app/AppHeader';
import { Popup } from 'src/components/base';
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

  @observable
  private optionOpened = false;

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
    return this.store.gameData.getCard(this.cardMainId);
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
        <MenuItem key={card.id}
          component={Link} {...{ to: `/${type}/${card.id}` }}
          disabled={this.type === type && this.id === card.id}
          onClick={this.closeOptions}
        >
          No. {card.id} - {card.name}
        </MenuItem>
      );
    };

    return <>
      <Helmet>
        <title>{`No. ${thisCard.id} - ${thisCard.name}`}</title>
      </Helmet>
      <AppHeader backButton={true}>
        <IconButton disabled={!prev} {...{ to: `/${this.type}/${prev && prev.id}`, replace: true }} component={Link} className="CardInfo-prev">
          <Icon>chevron_left</Icon>
        </IconButton>
        <IconButton disabled={!next} {...{ to: `/${this.type}/${next && next.id}`, replace: true }} component={Link} className="CardInfo-next">
          <Icon>chevron_right</Icon>
        </IconButton>
        <Popup
          header={<IconButton><Icon>settings</Icon></IconButton>} className="CardInfo-options"
          anchor="action" opened={this.optionOpened} open={this.openOptions} close={this.closeOptions}
        >
          <ul className="CardInfo-option-list">
            <Typography variant="caption" component="label" className="CardInfo-option-title">Card info</Typography>
            {linkButton('cards', thisCard)}
            <Typography variant="caption" component="label" className="CardInfo-option-title">Enemy info</Typography>
            {this.alternativeCards.map(card => linkButton('enemies', card))}
          </ul>
        </Popup>
      </AppHeader>
      <main className="CardInfo-root">
        <div className="CardInfo-content">{
          this.type === 'cards' ?
            <CardDetails id={this.id} className="CardInfo-details" /> :
            <EnemyDetails id={this.id} className="CardInfo-details" />
        }</div>
      </main>
    </>;
  }

  @action.bound
  private openOptions() {
    this.optionOpened = true;
  }

  @action.bound
  private closeOptions() {
    this.optionOpened = false;
  }
}