import { action, observable } from 'mobx';
import { observer, Provider } from 'mobx-react';
import * as React from 'react';
import { AppDrawer } from 'src/components/app/AppDrawer';
import { AppNotifications } from 'src/components/app/AppNotifications';
import { AppRoutes } from 'src/components/app/AppRoutes';
import { withRouter } from 'src/utils';
import './AppRoot.css';

export interface DrawerController {
  readonly drawerOpened: boolean;
  openDrawer(): void;
  closeDrawer(): void;
}

@withRouter
@observer
export class AppRoot extends React.Component implements DrawerController {
  @observable
  public drawerOpened = false;

  public render() {
    return (
      <Provider drawer={this}>
        <>
          <AppDrawer openDrawer={this.openDrawer} closeDrawer={this.closeDrawer} opened={this.drawerOpened} />
          <AppNotifications />
          <AppRoutes />
        </>
      </Provider>
    );
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