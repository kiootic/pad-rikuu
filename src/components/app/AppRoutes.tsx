import * as React from 'react';
import { Route } from 'react-router-dom';
import { CardInfo } from 'src/components/routes/CardInfo';
import { CardList } from 'src/components/routes/CardList';
import { MainPage } from 'src/components/routes/MainPage';

export function AppRoutes() {
  return <>
    <Route exact={true} path="/" component={MainPage} />
    <Route exact={true} path="/cards" component={CardList} />
    <Route path="/:type(cards|enemies)/:id" component={CardInfo} />
  </>;
}