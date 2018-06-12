import * as React from 'react';
import { Route } from 'react-router-dom';
import { CardInfo } from 'src/components/routes/CardInfo';
import { CardList } from 'src/components/routes/CardList';
import { DungeonList } from 'src/components/routes/DungeonList';
import { MainPage } from 'src/components/routes/MainPage';
import { Settings } from 'src/components/routes/Settings';

export function AppRoutes() {
  return <>
    <Route exact={true} path="/" component={MainPage} />
    <Route exact={true} path="/cards" component={CardList} />
    <Route path="/:type(cards|enemies)/:id" component={CardInfo} />
    <Route exact={true} path="/dungeons" component={DungeonList} />
    <Route exact={true} path="/dungeons/:dungeon" component={DungeonList} />
    <Route exact={true} path="/settings" component={Settings} />
  </>;
}