import { Button, CircularProgress, Fade, Icon, IconButton, TextField, Typography } from '@material-ui/core';
import { action, observable } from 'mobx';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { AppNotifications } from 'src/components/app/AppNotifications';
import { Store } from 'src/store';
import { bound, store, timeout } from 'src/utils';
import './Data.css';

@inject('store')
@observer
export class Data extends React.Component {
  public static readonly title = 'Data';

  @store
  private readonly store: Store;

  @observable
  private clearState = 0;

  @observable
  private baseUrl = this.store.storage.baseUrl;

  public render() {
    function actionButton(progress: boolean, handler: () => void, label: React.ReactNode) {
      return (
        <Button className="Data-button" onClick={handler} disabled={progress}>
          <CircularProgress
            className="Data-progress" size={16} thickness={8}
            style={{ visibility: progress ? 'visible' : 'hidden' }}
          />
          <span style={{ visibility: progress ? 'hidden' : 'visible', display: 'inherit', alignItems: 'inherit' }}>
            {label}
          </span>
        </Button>
      );
    }

    return (
      <div className="Data-root">
        <div className="Data-field">
          <Typography variant="caption" component="label">Last updated:</Typography>
          {this.store.updater.lastUpdated.toLocaleString()}
          {actionButton(
            this.store.updater.working,
            this.update,
            this.store.updater.updateAvailable ?
              <>update data<Icon style={{ marginLeft: 4 }}>update</Icon></> :
              'check update'
          )}
          {actionButton(this.clearState === 1, this.clearData, 'clear cache')}
          <Fade in={this.clearState === 2} timeout={500}><Icon>done</Icon></Fade>
        </div>
        <div className="Data-field">
          <TextField label="Data Source" style={{ flex: 1 }} value={this.baseUrl} onChange={this.baseUrlChanged} />
          <IconButton onClick={this.saveBaseUrl}>
            <Icon>save</Icon>
          </IconButton>
        </div>
      </div>
    );
  }

  @action
  private setClearDataState(state: number) {
    this.clearState = state;
  }

  @action.bound
  private baseUrlChanged(e: React.ChangeEvent<HTMLInputElement>) {
    this.baseUrl = e.target.value;
  }

  @bound
  private saveBaseUrl() {
    this.store.storage.baseUrl = this.baseUrl;
  }

  @bound
  private async update() {
    if (this.store.updater.updateAvailable) {
      await this.store.updater.updateData();
    } else {
      await this.store.updater.checkUpdate();
      if (!this.store.updater.updateAvailable)
        AppNotifications.show({
          message: 'Data is up to date'
        });
    }
  }

  @bound
  private async clearData() {
    this.setClearDataState(1);
    await Promise.all([timeout(500), this.store.storage.clear()]);

    this.setClearDataState(2);
    await timeout(500);
    if (this.clearState === 2)
      this.setClearDataState(0);
  }
}