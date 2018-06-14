import { AppBar, Hidden, Icon, IconButton, MuiThemeProvider, Toolbar, Typography } from '@material-ui/core';
import { History } from 'history';
import { action, observable } from 'mobx';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { AppController } from 'src/components/app/AppRoot';
import { AppSearch } from 'src/components/app/AppSearch';
import { themeInvert } from 'src/theme';
import { bound, prop, withRouter } from 'src/utils';
import './AppHeader.css';

export interface AppHeaderProps {
  children?: React.ReactNode;
  backButton?: boolean;
}

@inject('app')
@withRouter
@observer
export class AppHeader extends React.Component<AppHeaderProps> {
  @observable
  private searching = false;

  @prop('app')
  private readonly app: AppController;

  @prop('history')
  private readonly history: History;

  private root: HTMLElement | null = null;

  public render() {
    return (
      <div className="AppHeader-wrapper">
        <AppBar position="fixed" id="appHeader">
          <Toolbar className="AppHeader-root">
            <Hidden lgUp={true}>
              {this.props.backButton === true ?
                <IconButton onClick={this.goBack} className="AppHeader-menu"><Icon>arrow_back</Icon></IconButton> :
                <IconButton onClick={this.app.openDrawer} className="AppHeader-menu"><Icon>menu</Icon></IconButton>
              }
              <Typography variant="title" className="AppHeader-title" component={Link as any} {...{ to: '/' }}>
                Rikuu
              </Typography>
            </Hidden>
            <div className="AppHeader-spacer" />
            <div className="AppHeader-actions">
              {this.props.children}
              <IconButton onClick={this.beginSearch}><Icon>search</Icon></IconButton>
            </div>
            {
              this.searching && <MuiThemeProvider theme={themeInvert}>
                <div className="AppHeader-search" style={{ backgroundColor: themeInvert.palette.background.default }}>
                  <AppSearch className="AppHeader-search-field" showAdornment={false} autoFocus={true} onNavigate={this.endSearch} />
                  <IconButton onClick={this.endSearch} className="AppHeader-search-close"><Icon>close</Icon></IconButton>
                </div>
              </MuiThemeProvider>
            }
          </Toolbar>
        </AppBar >
      </div >
    );
  }

  @bound
  private goBack() {
    this.history.goBack();
  }

  @action.bound
  private beginSearch() {
    this.searching = true;
    this.root = document.getElementById('appHeader');
    document.addEventListener('click', this.onDocumentClick);
  }

  @action.bound
  private endSearch() {
    this.searching = false;
    this.root = null;
    document.removeEventListener('click', this.onDocumentClick);
  }

  @bound
  private onDocumentClick(e: PointerEvent) {
    if (!this.root || this.root.contains(e.target as HTMLElement))
      return;
    this.endSearch();
  }
}