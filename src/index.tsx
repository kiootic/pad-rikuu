/* tslint:disable:ordered-imports */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { App } from './App';
import registerServiceWorker from './registerServiceWorker';

import 'typeface-roboto';
import './index.css';
import 'material-icons/iconfont/material-icons.css';
import 'font-awesome/css/font-awesome.css';
import { Store } from 'src/store';

const store = new Store();

function renderApp() {
  ReactDOM.render(<App store={store} />, document.getElementById('root')!);
}

renderApp();
registerServiceWorker();

if (module.hot) {
	module.hot.accept('./App', () => renderApp());
}
