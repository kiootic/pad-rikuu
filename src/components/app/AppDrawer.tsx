import {
  Divider, Drawer, Hidden, Icon, List, ListItem, ListItemIcon, ListItemText,
  SwipeableDrawer, Typography
} from '@material-ui/core';
import * as React from 'react';
import { Link } from 'react-router-dom';
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

    const content = <>
      <List>
        {listItem('Cards', 'collections', '/cards')}
      </List>
      <Divider />
      <List>
        {listItem('Settings', 'settings', '/settings')}
      </List>
    </>;

    return <>
      <Hidden lgUp={true}>
        <SwipeableDrawer
          open={this.props.opened} onOpen={this.props.openDrawer} onClose={this.props.closeDrawer}
          classes={{ paper: 'AppDrawer-paper' }} children={content}
        />
      </Hidden>
      <Hidden mdDown={true}>
        <Drawer
          variant="permanent" open={true} onClose={this.props.closeDrawer}
          classes={{ paper: 'AppDrawer-paper' }}
        >
          <div className="AppDrawer-header">
            <Typography variant="title" component={Link as any} {...{ to: '/' }}>
              Rikuu
            </Typography>
          </div>
          {content}
        </Drawer>
      </Hidden>
    </>;
  }
}