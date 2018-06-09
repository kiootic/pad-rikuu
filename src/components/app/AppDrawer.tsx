import { Divider, Icon, List, ListItem, ListItemIcon, ListItemText, SwipeableDrawer } from '@material-ui/core';
import * as React from 'react';
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
        classes={{ paper: 'AppDrawer-root' }}
      >
        <List>
          {listItem('Cards', 'collections', '/cards')}
        </List>
        <Divider />
        <List>
          {listItem('Settings', 'settings', '/settings')}
        </List>
      </SwipeableDrawer>
    );
  }
}