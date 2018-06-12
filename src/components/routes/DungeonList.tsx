import { List, ListItem, ListItemText, Tab, Tabs, Typography } from '@material-ui/core';
import { orderBy, uniq } from 'lodash';
import { action, computed, observable } from 'mobx';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import scrollIntoView from 'scroll-into-view-if-needed';
import { AppHeader } from 'src/components/app/AppHeader';
import { Store } from 'src/store';
import { store } from 'src/utils';
import './DungeonList.css';

const tabs: Array<{ label: string, types: number[] }> = [
  { label: 'Special', types: [1] },
  { label: 'Gift', types: [3] },
  { label: 'Technical', types: [2] },
  { label: 'Normal', types: [0] },
  { label: 'Ranking', types: [4] },
  { label: 'Multiplayer', types: [5, 7] },
];

type Props = RouteComponentProps<{ dungeon?: string }>;

@inject('store')
@observer
export class DungeonList extends React.Component<Props> {
  @store
  private readonly store: Store;

  @computed
  private get selectedDungeon() {
    const id = this.props.match.params.dungeon;
    if (!id) return undefined;

    return this.store.gameData.getDungeon(Number(id));
  }

  @observable
  private selectedTab = this.selectedDungeon ?
    tabs.find(tab => tab.types.indexOf(this.selectedDungeon!.type) >= 0)!.label :
    tabs[0].label;

  private root: HTMLElement;

  @computed
  private get dungeons() {
    return orderBy(
      uniq(this.store.gameData.waves.map(info => info.dungeon))
        .map(id => this.store.gameData.getDungeon(id)!),
      dungeon => -(dungeon.order ? dungeon.order / 100 : dungeon.id)
    );
  }

  public componentDidMount() {
    this.scrollToSelectedItem();
  }

  public componentDidUpdate() {
    this.scrollToSelectedItem();
  }

  public render() {
    const types = tabs.find(tab => tab.label === this.selectedTab)!.types;
    const dungeons = this.dungeons.filter(dungeon => types.indexOf(dungeon.type) >= 0);
    const selectedDungeon = this.selectedDungeon && types.indexOf(this.selectedDungeon.type) >= 0 ?
      this.selectedDungeon : undefined;

    return <>
      <AppHeader />
      <Tabs value={this.selectedTab} onChange={this.onChange} fullWidth={true} scrollable={true}>{
        tabs.map(tab => <Tab label={tab.label} value={tab.label} key={tab.label} />)
      }</Tabs>
      <div className="DungeonList-root" ref={elem => this.root = elem!}>
        <List className="DungeonList-list">{
          dungeons.map(dungeon => {
            let name = dungeon.name;
            let badge = '';
            const selected = selectedDungeon && selectedDungeon.id === dungeon.id;

            const bgMatch = /^\$(.{6})\$(.*)$/.exec(name);
            if (bgMatch)
              name = bgMatch[2];

            const typeMatch = /^#(.)#(.*)$/.exec(name);
            if (typeMatch) {
              if (typeMatch[1] === 'C')
                badge = 'collab';
              else if (typeMatch[1] === 'G')
                badge = 'guerilla';
              name = typeMatch[2];
            }

            if (dungeon.weekday !== 0)
              badge = 'weekday';
            else if (dungeon.once)
              badge = 'once';

            return (
              <ListItem
                key={dungeon.id} className={`DungeonList-item ${selected ? 'DungeonList-item-selected' : ''}`}
                style={{ '--dungeon-color': bgMatch ? `#${bgMatch[1]}60` : 'transparent' } as any}
                button={true} component={Link} {...{ to: `/dungeons/${dungeon.id}` }}
              >
                <ListItemText >
                  <span className="DungeonList-item-text">
                    {name}
                    {badge && <Typography variant="caption" className="DungeonList-item-badge">{badge}</Typography>}
                  </span>
                </ListItemText>
              </ListItem>
            );
          })
        }</List>
        <List className="DungeonList-list">{
          selectedDungeon && selectedDungeon.floors.map(floor => {
            let name = floor.name;
            const badges: string[] = [];

            const bgMatch = /^\$(.{6})\$(.*)$/.exec(name);
            if (bgMatch)
              name = bgMatch[2];

            return (
              <ListItem
                key={floor.id} className="DungeonList-item"
                style={{ '--dungeon-color': bgMatch ? `#${bgMatch[1]}60` : 'transparent' } as any}
                button={true} component={Link} {...{ to: `/dungeons/${selectedDungeon!.id}/${floor.id}` }}
              >
                <ListItemText>
                  <span className="DungeonList-item-text">
                    {name}
                    {badges.map(badge =>
                      <Typography variant="caption" className="DungeonList-item-badge" key={badge}>
                        {badge}
                      </Typography>
                    )}
                  </span>
                </ListItemText>
              </ListItem>
            );
          })
        }</List>
      </div>
    </>;
  }

  @action.bound
  private onChange(e: React.ChangeEvent<any>, value: string) {
    this.selectedTab = value;
  }

  private scrollToSelectedItem() {
    if (!this.root) return;
    const selectedItem = this.root.querySelector('.DungeonList-item-selected');
    if (!selectedItem) return;
    scrollIntoView(selectedItem, {
      scrollMode: 'if-needed',
      block: 'nearest',
      inline: 'nearest'
    });
  }
}