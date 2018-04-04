import React from 'react';
import { observer } from 'mobx-react';
import { repeat, range, maxBy, minBy } from 'lodash';
import Link from 'next/link';

import css from 'styles/pages/card.scss';
import { Page } from 'app/components/page';
import { CardInfo as CardInfoComponent } from 'app/components/cardInfo';
import { Store } from 'app/store';

interface CardInfoProps {
  url: Url;
}

@observer
export default class CardInfo extends React.Component<CardInfoProps> {
  private store = Store.instance;

  constructor(props: CardInfoProps) {
    super(props);
  }

  render() {
    return Page(() => {
      const id = Number(this.props.url.query['id']);
      const prev = maxBy(this.store.gameDB.cards.filter(card => card.id < id && !card.isEmpty), card => card.id);
      const next = minBy(this.store.gameDB.cards.filter(card => card.id > id && !card.isEmpty), card => card.id);

      const prevLink = <a className={css.nav}><i className="fa fa-angle-double-left" /></a>;
      const nextLink = <a className={css.nav}><i className="fa fa-angle-double-right" /></a>;

      return <div className={css.main}>
        {prev ? <Link href={`/card?id=${prev.id}`}>{prevLink}</Link> : prevLink}
        <CardInfoComponent id={Number(this.props.url.query['id'])} className={css.info} />
        {next ? <Link href={`/card?id=${next.id}`}>{nextLink}</Link> : nextLink}
      </div>;
    });
  }
}
