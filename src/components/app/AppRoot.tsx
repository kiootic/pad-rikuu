import { action, observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import { AppDrawer } from 'src/components/app/AppDrawer';
import { AppHeader } from 'src/components/app/AppHeader';
import { AppRoutes } from 'src/components/app/AppRoutes';
import { withRouter } from 'src/utils';
import './AppRoot.css';

@withRouter
@observer
export class AppRoot extends React.Component {
  @observable
  private drawerOpened = false;

  public render() {
    return <>
      <AppHeader openDrawer={this.openDrawer} />
      <AppDrawer closeDrawer={this.closeDrawer} opened={this.drawerOpened} />

      <div className="AppRoot-content">
        <AppRoutes />
      </div>
    </>;
  }

  @action.bound
  private openDrawer() {
    this.drawerOpened = true;
  }

  @action.bound
  private closeDrawer() {
    this.drawerOpened = false;
  }
}