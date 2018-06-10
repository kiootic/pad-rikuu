import {
  CssBaseline, Hidden, jssPreset,
  MuiThemeProvider, Typography
} from '@material-ui/core';
import { create } from 'jss';
import { observer, Provider } from 'mobx-react';
import DevTools from 'mobx-react-devtools';
import * as React from 'react';
import { JssProvider } from 'react-jss';
import { BrowserRouter } from 'react-router-dom';
import { AppRoot } from 'src/components/app/AppRoot';
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
        <Provider store={this.props.store}>
          <JssProvider jss={jss}>
            <MuiThemeProvider theme={theme}>
              <CssBaseline />
              <Typography className="App-root" component="div">
                {
                  !this.props.store.isLoaded ? <div className="App-loading" /> : (
                    <BrowserRouter>
                      <AppRoot />
                    </BrowserRouter>
                  )
                }
              </Typography>
            </MuiThemeProvider>
          </JssProvider>
        </Provider>
        <Hidden smDown={true}>
          <DevTools />
        </Hidden>
      </>
    );
  }

  private async loadStore() {
    const store = this.props.store;
    await store.load();
    await store.updater.checkUpdate();
  }
}
