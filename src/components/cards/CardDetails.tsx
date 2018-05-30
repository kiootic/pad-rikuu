import { Paper, Typography } from '@material-ui/core';
import { repeat } from 'lodash';
import { computed } from 'mobx';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { Asset, HoverPopup } from 'src/components/base';
import { CardImage } from 'src/components/cards/CardImage';
import { Store } from 'src/store';
import { store } from 'src/utils';
import './CardDetails.css';
import { CardEvolution } from './CardEvolution';
import { CardIcon } from './CardIcon';
import { CardSkill } from './CardSkill';
import { CardStats } from './CardStats';

export interface CardDetailsProps {
  id: number;
  className?: string;
}

@inject('store')
@observer
export class CardDetails extends React.Component<CardDetailsProps> {
  @store
  private readonly store: Store;

  @computed
  private get id() { return this.props.id || 0; }

  @computed
  private get card() { return this.store.gameData.cards.find(card => card.id === this.id); }

  public render() {
    const card = this.card;
    if (!card) return null;

    function section(title: string, className: string, content: JSX.Element) {
      return (
        <Paper className={`CardDetails-section CardDetails-${className}`}>
          <section>
            {title ? <Typography variant="caption" className="CardDetails-heading">{title}</Typography> : null}
            {content}
          </section>
        </Paper>
      );
    }

    return (
      <article className={`${this.props.className} CardDetails-root`}>
        {section('', 'image', <>
          <CardImage id={card.id} />
          <div className="CardDetails-awakenings">
            <div className="CardDetails-awakenings-col">{card.awakenings.map((id: number, i: number) =>
              <Asset key={i} className="CardDetails-awakening" assetId={`awakening-${id}`} />
            )}</div>
            {
              card.superAwakenings.length === 0 ? null : <div className="CardDetails-awakenings-col">
                <HoverPopup
                  direction="left"
                  header={<Asset className="CardDetails-awakening" assetId="awakening-unknown" />}
                >
                  <div className="CardDetails-awakenings-super">{
                    card.superAwakenings.map((id: number, i: number) =>
                      <Asset key={i} className="CardDetails-awakening" assetId={`awakening-${id}`} />
                    )
                  }</div>
                </HoverPopup>
              </div>
            }
          </div>
        </>)}
        {section('', 'summary', <>
          <CardIcon id={card.id} link={false} />
          <div className="CardDetails-summary-basic">
            <p>No. {card.id}</p>
            <Typography variant="title" component="h1">{card.name}</Typography>
            <p>{repeat('\u2605', card.rarity)}</p>
          </div>
          <div className="CardDetails-summary-extended">
            <div>
              {
                card.attrs.filter(attr => attr !== -1)
                  .map((attr, i) => <Asset className="CardDetails-icon" assetId={`attr-${attr}`} key={i} />)
              }
            </div>
            <div>
              {
                card.types.filter(type => type !== -1)
                  .map((type, i) => <Asset className="CardDetails-icon" assetId={`type-${type}`} key={i} />)
              }
            </div>
            <p>max level: {card.maxLevel}</p>
            <p>max exp: {card.exp.max}</p>
            <p>cost: {card.cost}</p>
            <p>assist: {card.canAssist ? '\u2713' : '\u2717'}</p>
          </div>
        </>)}
        {section('Stats', 'stats', <CardStats id={card.id} />)}
        {section('Active Skill', 'active-skill', <CardSkill id={card.activeSkillId} />)}
        {section('Leader Skill', 'leader-skill', <CardSkill id={card.leaderSkillId} />)}
        {section('Evolution', 'evolution', <CardEvolution id={card.id} />)}
      </article>
    );
  }
}