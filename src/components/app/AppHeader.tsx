import { AppBar, Icon, IconButton, Toolbar, Typography } from '@material-ui/core';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { AppSearch } from 'src/components/app/AppSearch';
import './AppHeader.css';

export interface AppHeaderProps {
  openDrawer: () => void;
}

export class AppHeader extends React.Component<AppHeaderProps> {
  public render() {
    return (
      <AppBar position="sticky">
        <Toolbar>
          <div className="AppHeader-header">
            <IconButton onClick={this.props.openDrawer}><Icon>menu</Icon></IconButton>
            <Typography variant="title" className="AppHeader-title" component={Link as any} {...{ to: '/' }}>
              Rikuu
            </Typography>
          </div>
          <AppSearch />
        </Toolbar>
      </AppBar>
    );
  }
}