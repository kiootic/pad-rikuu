import { Hidden, Paper, Typography } from '@material-ui/core';
import { clamp } from 'lodash';
import { action, computed, IReactionDisposer, observable, reaction } from 'mobx';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { Asset } from 'src/components/base';
import { CardIcon } from 'src/components/cards/CardIcon';
import { CardImage } from 'src/components/cards/CardImage';
import { EnemySkills } from 'src/components/enemies/EnemySkills';
import { EnemyStats } from 'src/components/enemies/EnemyStats';
import { Store } from 'src/store';
import { store } from 'src/utils';
import './EnemyDetails.css';

export interface EnemyDetailsProps {
  id: number;
  className?: string;
}

@inject('store')
@observer
export class EnemyDetails extends React.Component<EnemyDetailsProps> {
  @store
  private readonly store: Store;

  @computed
  private get id() { return this.props.id || 0; }

  @computed
  private get card() { return this.store.gameData.getCard(this.id); }

  @observable
  private selectedLevel = 1;
  private disposer: IReactionDisposer;

  public componentDidMount() {
    this.disposer = reaction(() => this.card, () => {
      this.selectedLevel = 1;
    });
  }

  public componentWillUnmount() {
    this.disposer();
  }

  public render() {
    const card = this.card;
    if (!card) return null;

    function section(title: string, className: string, content: JSX.Element) {
      return (
        <Paper className={`EnemyDetails-section EnemyDetails-${className}`}>
          <section>
            {title ? <Typography variant="caption" className="EnemyDetails-heading">{title}</Typography> : null}
            {content}
          </section>
        </Paper>
      );
    }

    return (
      <article className={`${this.props.className} EnemyDetails-root`}>
        {section('', 'image', <>
          <CardImage id={card.id} />
        </>)}
        {section('', 'summary', <>
          <Hidden smDown={true}>
            <CardIcon id={card.id} link={false} />
          </Hidden>
          <Hidden smUp={true}>
            <CardIcon id={card.id} link={false} scale={0.8} />
          </Hidden>
          <div className="EnemyDetails-summary-basic">
            <p>No. {card.id}</p>
            <Typography variant="title" component="h1">{card.name}</Typography>
          </div>
          <div className="EnemyDetails-summary-extended">
            <div>
              {
                card.attrs.filter(attr => attr !== -1)
                  .map((attr, i) => <Asset className="EnemyDetails-icon" assetId={`attr-${attr}`} key={i} />)
              }
            </div>
            <div>
              {
                card.types.filter(type => type !== -1)
                  .map((type, i) => <Asset className="EnemyDetails-icon" assetId={`type-${type}`} key={i} />)
              }
            </div>
            <p>max level: {card.enemy.maxLevel}</p>
            <p>attack interval: {card.enemy.countdown}</p>
          </div>
        </>)}
        {section('Stats', 'stats', <EnemyStats id={card.id} level={this.selectedLevel} selectLevel={this.selectLevel} />)}
        {section('Skills', 'skills', <EnemySkills id={card.id} level={this.selectedLevel} />)}
      </article>
    );
  }

  @action.bound
  private selectLevel(level: number) {
    this.selectedLevel = clamp(Math.floor(level), 1, 99);
  }
}