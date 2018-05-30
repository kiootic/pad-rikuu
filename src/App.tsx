import { CssBaseline, MuiThemeProvider, Typography } from '@material-ui/core';
import { observer, Provider } from 'mobx-react';
import DevTools from 'mobx-react-devtools';
import * as React from 'react';
import { BrowserRouter, Redirect, Route } from 'react-router-dom';
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
                    <div className="App-content">
                      <Route exact={true} path="/" render={indexRedirect} />
                      <Route exact={true} path="/cards" component={CardList} />
                      <Route path="/cards/:id" component={CardInfo} />
                    </div>
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
