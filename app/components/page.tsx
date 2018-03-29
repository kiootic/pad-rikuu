import React from 'react';
import { observer } from 'mobx-react';
import { Store } from 'app/store';
import css from 'styles/components/page.scss';

@observer
export class Page extends React.Component {
  private readonly store = Store.instance;

  componentDidMount() {
    if (!this.store.isLoaded)
      this.store.load();
  }

  render() {
    if (this.store.isLoaded) {
      return <div className={css.root}>{this.props.children}</div>;
    } else {
      return <div className={`${css.root} ${css.loading}`}>loading...</div>;
    }
  }
}