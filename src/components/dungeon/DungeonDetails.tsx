import { ExpansionPanel, ExpansionPanelDetails, ExpansionPanelSummary, Icon, Paper, Typography } from '@material-ui/core';
import { computed } from 'mobx';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { DungeonEnemyDetails } from 'src/components/dungeon/DungeonEnemyDetails';
import { Dungeon, RFlags1 } from 'src/models';
import { Store } from 'src/store';
import { store } from 'src/utils';
import './DungeonDetails.css';

export interface DungeonDetailsProps {
  className?: string;
  dungeon: Dungeon;
  floor: number;
}

@inject('store')
@observer
export class DungeonDetails extends React.Component<DungeonDetailsProps> {
  @store
  private readonly store: Store;

  @computed
  private get dungeon() {
    return this.props.dungeon;
  }

  @computed
  private get floor() {
    return this.props.dungeon.floors.find(floor => floor.id === Number(this.props.floor))!;
  }

  private get data() {
    return this.store.gameData.waves
      .find(data => data.dungeon === this.props.dungeon.id && data.floor === this.props.floor);
  }

  public render() {
    const dungeon = this.dungeon;
    const floor = this.floor;
    const data = this.data;

    function statEntry(header: React.ReactNode, content: React.ReactNode) {
      return (
        <div className="DungeonDetails-stats-entry">
          <span className="DungeonDetails-stats-header">{header}</span>
          <span className="DungeonDetails-stats-value">{content}</span>
        </div>
      );
    }

    return (
      <article className={`${this.props.className || ''} DungeonDetails-root`}>
        <Paper component="section" className="DungeonDetails-section" style={{ padding: 16 }}>
          <div className="DungeonDetails-header">
            <Typography variant="title" component={Link as any} {...{ to: `/dungeons/${dungeon.id}` }}> {dungeon.name}</Typography>
            &raquo;
            <Typography variant="title">{floor.name}</Typography>
          </div>
          <div className="DungeonDetails-stats">
            {statEntry('Stamina', floor.stamina)}
            {statEntry('Waves', floor.waves)}
          </div>
        </Paper>
        {data && <section className="DungeonDetails-section">{
          data.waves.map((wave, i) => (
            <ExpansionPanel key={i} defaultExpanded={true}>
              <ExpansionPanelSummary expandIcon={<Icon>expand_more</Icon>}>
                <div className="DungeonDetails-wave-header">
                  <Typography>Wave {i + 1}</Typography>
                  {wave.type === 'random' &&
                    <Typography variant="caption" className="DungeonDetails-wave-type">{
                      wave.minEnemies === wave.maxEnemies ?
                        `random ${wave.minEnemies} enemies` :
                        `random ${wave.minEnemies} ~ ${wave.maxEnemies} enemies`
                    }</Typography>
                  }
                </div>
              </ExpansionPanelSummary>
              <ExpansionPanelDetails className="DungeonDetails-wave-details">
                {wave.enemies.map((enemy, j) =>
                  <DungeonEnemyDetails
                    key={j} className="DungeonDetails-enemy"
                    // tslint:disable-next-line:no-bitwise
                    enemy={enemy} technical={(floor.rflags1 & RFlags1.Technical) !== 0}
                  />)
                }
              </ExpansionPanelDetails>
            </ExpansionPanel>
          ))
        }</section>}
      </article>
    );
  }
}