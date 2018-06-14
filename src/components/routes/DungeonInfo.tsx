import { Icon, IconButton } from '@material-ui/core';
import { maxBy, minBy } from 'lodash';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { Link, RouteComponentProps } from 'react-router-dom';
import { AppHeader } from 'src/components/app/AppHeader';
import { DungeonDetails } from 'src/components/dungeon/DungeonDetails';
import { parse } from 'src/parsers/DungeonNameParser';
import { Store } from 'src/store';
import { store } from 'src/utils';
import './DungeonInfo.css';

@inject('store')
@observer
export class DungeonInfo extends React.Component<RouteComponentProps<{ dungeon: string, floor: string }>> {
  @store
  private readonly store: Store;

  public render() {
    const dungeon = this.store.gameData.getDungeon(Number(this.props.match.params.dungeon))!;
    const floor = Number(this.props.match.params.floor);

    const prev = maxBy(dungeon.floors.filter(f => f.id < floor), f => f.id);
    const next = minBy(dungeon.floors.filter(f => f.id > floor), f => f.id);

    return <>
      <Helmet>
        <title>{`${parse(dungeon.name).name} - ${parse(dungeon.floors.find(f => f.id === floor)!.name).name}`}</title>
      </Helmet>
      <AppHeader>
        <IconButton disabled={!prev} {...{ to: `/dungeons/${dungeon.id}/${prev && prev.id}`, replace: true }} component={Link} className="CardInfo-prev">
          <Icon>chevron_left</Icon>
        </IconButton>
        <IconButton disabled={!next} {...{ to: `/dungeons/${dungeon.id}/${next && next.id}`, replace: true }} component={Link} className="CardInfo-next">
          <Icon>chevron_right</Icon>
        </IconButton>
      </AppHeader>
      <div className="DungeonInfo-root">
        <DungeonDetails dungeon={dungeon} floor={floor} className="DungeonInfo-content" />
      </div>
    </>;
  }
}