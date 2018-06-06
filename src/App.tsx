import {
  AppBar, CssBaseline, Drawer, Icon, Input, InputAdornment,
  List, ListItem, ListItemIcon, ListItemText,
  MuiThemeProvider, Toolbar, Typography
} from '@material-ui/core';
import { observer, Provider } from 'mobx-react';
import DevTools from 'mobx-react-devtools';
import * as React from 'react';
import { BrowserRouter, Redirect, Route } from 'react-router-dom';
import { AppLink } from 'src/components/base';
import { CardInfo } from 'src/components/routes/CardInfo';
import { CardList } from 'src/components/routes/CardList';
import { Store } from 'src/store';
import { theme } from 'src/theme';
import './App.css';

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
    function indexRedirect() {
      return <Redirect to="/cards" />;
    }

    return (
      <>
        <Provider store={this.props.store}>
          <MuiThemeProvider theme={theme}>
            <CssBaseline />
            <Typography className="App-root" component="div">
              {
                !this.props.store.isLoaded ? <div className="App-loading" /> : (
                  <BrowserRouter>
                    <>
                      <AppBar position="fixed" style={{ zIndex: theme.zIndex.drawer + 1 }}>
                        <Toolbar>
                          <Typography variant="title" color="inherit" className="App-title">Rikuu</Typography>
                          <Input type="text" className="App-search" startAdornment={
                            <InputAdornment position="start">
                              <Icon>search</Icon>
                            </InputAdornment>
                          } />
                        </Toolbar>
                      </AppBar>

                      <Drawer variant="persistent" anchor="left" open={true}
                        classes={{ paper: 'App-drawer' }} className="App-drawer"
                      >
                        <div style={{ ...theme.mixins.toolbar, marginBottom: 8 }} />
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
                        <div style={{ ...theme.mixins.toolbar, width: '100%', marginBottom: 8 }} />
                        <div className="App-content">
                          <Route exact={true} path="/" render={indexRedirect} />
                          <Route exact={true} path="/cards" component={CardList} />
                          <Route path="/:type(cards|enemies)/:id" component={CardInfo} />
                        </div>
                      </div>
                    </>
                  </BrowserRouter>
                )
              }
            </Typography>
          </MuiThemeProvider>
        </Provider>
        <DevTools />
      </>
    );
  }
}
