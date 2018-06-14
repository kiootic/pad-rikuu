import { Typography } from '@material-ui/core';
import { History } from 'history';
import { action, observable } from 'mobx';
import { observer, Provider } from 'mobx-react';
import * as React from 'react';
import { AppDrawer } from 'src/components/app/AppDrawer';
import { AppHeader } from 'src/components/app/AppHeader';
import { AppNotifications } from 'src/components/app/AppNotifications';
import { AppRoutes } from 'src/components/app/AppRoutes';
import {  prop, withRouter } from 'src/utils';
import './AppRoot.css';

interface ErrorData {
  error: Error;
  info: React.ErrorInfo;
}

export interface AppController {
  readonly drawerOpened: boolean;
  openDrawer(): void;
  closeDrawer(): void;
}

@withRouter
@observer
export class AppRoot extends React.Component implements AppController {
  @observable
  public drawerOpened = false;
  
  @observable
  private error: ErrorData | undefined;

  @prop('history')
  private readonly history: History;
  private disposer: () => void;

  public render() {
    const { error, info } = this.error || {} as ErrorData;
    return (
      <Provider app={this}>
        <Typography className="AppRoot-content" component="div">
          <AppNotifications />
          <AppDrawer openDrawer={this.openDrawer} closeDrawer={this.closeDrawer} opened={this.drawerOpened} />
          {!error ? <AppRoutes /> : <>
            <AppHeader />
            <div className="AppRoot-error">
              <Typography variant="display1">Unexpected error</Typography>
              <Typography variant="title">{
                error.stack ?
                  error.stack.substring(0, error.stack.indexOf('\n')) :
                  `${error.name}${error.message ? ': ' + error.message : ''}`
              }</Typography>
              <p className="AppRoot-error-stack">{error.stack && error.stack.substring(error.stack.indexOf('\n') + 1)}</p>
              <p className="AppRoot-error-stack">{info.componentStack}</p>
            </div>
          </>}
        </Typography>
      </Provider>
    );
  }

  public componentDidMount() {
    this.disposer = this.history.listen(action(() => {
      this.error = undefined;
    }));
  }

  public componentWillUnmount() {
    this.disposer();
  }

  @action
  public componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.error = { error, info };
  }

  @action.bound
  public openDrawer() {
    this.drawerOpened = true;
  }

  @action.bound
  public closeDrawer() {
    this.drawerOpened = false;
  }
}