import {
  AppBar, CssBaseline, Drawer, Icon, jssPreset,
  List, ListItem, ListItemIcon, ListItemText,
  MuiThemeProvider, Toolbar, Typography, withStyles
} from '@material-ui/core';
import { create } from 'jss';
import { observer, Provider } from 'mobx-react';
import DevTools from 'mobx-react-devtools';
import * as React from 'react';
import { JssProvider } from 'react-jss';
import { BrowserRouter, Redirect, Route } from 'react-router-dom';
import { AppSearch } from 'src/components/app/AppSearch';
import { AppLink } from 'src/components/base';
import { CardInfo } from 'src/components/routes/CardInfo';
import { CardList } from 'src/components/routes/CardList';
import { Store } from 'src/store';
import { theme } from 'src/theme';
import { bound } from 'src/utils';
import './App.css';

const jss = create(Object.assign(
  jssPreset(),
  { insertionPoint: document.getElementById('jss-insertion-point') }
));

export interface AppProps {
  store: Store;
}

@observer
export class App extends React.Component<AppProps> {
  public componentDidMount() {
    this.props.store.load();
    history.scrollRestoration = 'auto';
  }

  public componentDidUpdate() {
    this.props.store.load();
  }

  public render() {
    return (
      <>
        <Provider store={this.props.store}>
          <JssProvider jss={jss}>
            <MuiThemeProvider theme={theme}>
              <CssBaseline />
              <Typography className="App-root" component="div">
                {
                  !this.props.store.isLoaded ? <div className="App-loading" /> : (
                    <BrowserRouter>{
                      React.createElement(
                        withStyles(
                          (t) => ({
                            appBar: { zIndex: t.zIndex.drawer + 1 },
                            drawerPadding: { ...t.mixins.toolbar },
                            contentPadding: { ...t.mixins.toolbar, width: '100%' }
                          }),
                          {
                            withTheme: true,
                            name: 'AppRoot'
                          })(this.renderRoot)
                      )
                    }</BrowserRouter>
                  )
                }
              </Typography>
            </MuiThemeProvider>
          </JssProvider>
        </Provider>
        <DevTools />
      </>
    );
  }

  @bound
  private renderRoot({ classes }: any) {
    function indexRedirect() {
      return <Redirect to="/cards" />;
    }

    return <>
      <AppBar position="fixed" className={classes.appBar}>
        <Toolbar>
          <Typography variant="title" color="inherit" className="App-title">Rikuu</Typography>
          <AppSearch />
        </Toolbar>
      </AppBar>

      <Drawer variant="persistent" anchor="left" open={true}
        classes={{ paper: 'App-drawer' }} className="App-drawer"
      >
        <div className={classes.drawerPadding} />
        <List>
          <ListItem button={true} component={AppLink} {...{ to: '/cards', exact: true }}>
            <ListItemIcon>
              <Icon>collections</Icon>
            </ListItemIcon>
            <ListItemText primary="Cards" />
          </ListItem>
        </List>
      </Drawer>

      <div className="App-content-wrapper">
        <div className={classes.contentPadding} />
        <div className="App-content">
          <Route exact={true} path="/" render={indexRedirect} />
          <Route exact={true} path="/cards" component={CardList} />
          <Route path="/:type(cards|enemies)/:id" component={CardInfo} />
        </div>
      </div>
    </>;
  }
}
