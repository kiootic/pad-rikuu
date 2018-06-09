import { Button, CircularProgress, Fade, Icon } from '@material-ui/core';
import { action, observable } from 'mobx';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { Store } from 'src/store';
import { bound, store } from 'src/utils';
import './Data.css';

@inject('store')
@observer
export class Data extends React.Component {
  public static readonly title = 'Data';

  @store
  private readonly store: Store;

  @observable
  private clearState = 0;

  public render() {
    return (
      <div className="Data-root">
        <div className="Data-field">
          <Button className="Data-clear-data" onClick={this.clearData}>
            {this.clearState === 1 ? <CircularProgress className="Data-progress" size={16} /> : 'clear data'}
          </Button>
          <Fade in={this.clearState === 2} timeout={500}><Icon>done</Icon></Fade>
        </div>
      </div>
    );
  }

  @action
  private setClearDataState(state: number) {
    this.clearState = state;
  }

  @bound
  private async clearData() {
    this.setClearDataState(1);
    await this.store.storage.clear();
    this.setClearDataState(2);
    setTimeout(() => this.clearState === 2 && this.setClearDataState(0), 500);
  }
}