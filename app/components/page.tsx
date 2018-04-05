import React from 'react';
import { observer } from 'mobx-react';
import DevTools from 'mobx-react-devtools';
import { Store } from 'app/store';
import css from 'styles/components/page.scss';

interface PageProps {
  childrenFn(): JSX.Element;
}

@observer
class PageComponent extends React.Component<PageProps> {
  private readonly store = Store.instance;

  componentDidMount() {
    if (!this.store.isLoaded)
      this.store.load();
  }

  render() {
    if (this.store.isLoaded) {
      return (
        <div className={css.root}>
          <div className={css.main}>
            {this.props.childrenFn()}
          </div>
          <DevTools />
        </div>
      );
    } else {
      return <div className={`${css.root} ${css.loading}`}>loading...</div>;
    }
  }
}

export function Page(children: () => JSX.Element) {
  return <PageComponent childrenFn={children} />
}