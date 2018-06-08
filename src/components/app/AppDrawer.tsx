import { Hidden, Icon, List, ListItem, ListItemIcon, ListItemText, SwipeableDrawer } from '@material-ui/core';
import * as React from 'react';
import { AppSearch } from 'src/components/app/AppSearch';
import { AppLink } from 'src/components/base';
import './AppDrawer.css';

export interface AppDrawerProps {
  opened: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

export class AppDrawer extends React.Component<AppDrawerProps> {
  public render() {
    const closeDrawer = this.props.closeDrawer;
    function listItem(title: string, icon: string, to: string, exact = false) {
      return (
        <ListItem button={true} component={AppLink} {...{ to, exact }} onClick={closeDrawer}>
          <ListItemIcon><Icon>{icon}</Icon></ListItemIcon>
          <ListItemText primary={title} />
        </ListItem>
      );
    }

    return (
      <SwipeableDrawer
        open={this.props.opened} onOpen={this.props.openDrawer} onClose={this.props.closeDrawer}
        classes={{ paper: 'AppDrawer-root' }} disableSwipeToOpen={false}
      >
        <Hidden smUp={true}>
          <AppSearch className="AppDrawer-search" onNavigate={this.props.closeDrawer} />
        </Hidden>
        <List>
          {listItem('Cards', 'collections', '/cards')}
        </List>
      </SwipeableDrawer>
    );
  }
}