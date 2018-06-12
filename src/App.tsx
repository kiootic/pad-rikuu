import { CssBaseline, Hidden, jssPreset, MuiThemeProvider, Typography } from '@material-ui/core';
import { create } from 'jss';
import { observer, Provider } from 'mobx-react';
import DevTools from 'mobx-react-devtools';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { JssProvider } from 'react-jss';
import { BrowserRouter } from 'react-router-dom';
import { AppNotifications } from 'src/components/app/AppNotifications';
import { AppRoot } from 'src/components/app/AppRoot';
import registerServiceWorker from 'src/registerServiceWorker';
import { Store } from 'src/store';
import { theme } from 'src/theme';
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
    this.loadStore();
    history.scrollRestoration = 'auto';
  }

  public componentDidUpdate(prev: AppProps) {
    if (prev.store !== this.props.store)
      this.loadStore();
  }

  public render() {
    return (
      <>
        <Helmet
          defaultTitle="Rikuu"
          titleTemplate="%s - Rikuu"
        />
        <Provider store={this.props.store}>
          <JssProvider jss={jss}>
            <MuiThemeProvider theme={theme}>
              <CssBaseline />
              {
                !this.props.store.isLoaded ? <Typography className="App-loading" component="div" /> : (
                  <BrowserRouter>
                    <AppRoot />
                  </BrowserRouter>
                )
              }
            </MuiThemeProvider>
          </JssProvider>
        </Provider>
        {
          process.env.NODE_ENV !== 'production' &&
          <Hidden smDown={true}>
            <DevTools position={{ right: 300, top: 0 }} />
          </Hidden>
        }
      </>
    );
  }

  private async loadStore() {
    const store = this.props.store;
    await store.load();
    await registerServiceWorker(swResult => {
      if (swResult === 'updated') {
        AppNotifications.show({
          message: 'Refresh to update application'
        });
      } else if (swResult === 'ok') {
        AppNotifications.show({
          message: 'You can use the application offline now'
        });
      }
    });
    await store.updater.checkUpdate();
  }
}
