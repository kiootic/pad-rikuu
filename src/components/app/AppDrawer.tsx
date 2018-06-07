import { Drawer, Icon, List, ListItem, ListItemIcon, ListItemText } from '@material-ui/core';
import * as React from 'react';
import { AppLink } from 'src/components/base';
import './AppDrawer.css';

export interface AppDrawerProps {
  opened: boolean;
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
      <Drawer open={this.props.opened} onClose={this.props.closeDrawer} classes={{ paper: 'AppDrawer-root' }}>
        <List>
          {listItem('Cards', 'collections', '/cards')}
        </List>
      </Drawer>
    );
  }
}