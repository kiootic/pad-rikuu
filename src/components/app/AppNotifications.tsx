import { Button, Snackbar } from '@material-ui/core';
import { action, IReactionDisposer, observable, reaction } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import { prop, withWidth } from 'src/utils';
import './AppNotifications.css';

export interface Notification {
  message: React.ReactNode;
  action?: {
    content: React.ReactNode;
    fn: () => void;
  };
}

@withWidth()
@observer
export class AppNotifications extends React.Component {
  @action
  public static show(notification: Notification) {
    this.pending = notification;
  }

  @observable.ref
  private static pending: Notification | undefined;

  @observable
  private current: Notification | undefined;
  @observable
  private opened = false;

  private disposer: IReactionDisposer;

  @prop('width')
  private readonly width: string;

  public componentDidMount() {
    this.disposer = reaction(
      () => ({
        pending: AppNotifications.pending,
        current: this.current
      }),
      action(({ pending, current }) => {
        if (pending && current)
          this.opened = false;
        else if (pending) {
          this.current = pending;
          AppNotifications.pending = undefined;
          this.opened = !!this.current;
        }
      })
    );
  }

  public componentWillUnmount() {
    this.disposer();
  }

  public render() {
    return (
      <Snackbar
        className="AppNotifications-snackbar"
        anchorOrigin={{ vertical: 'bottom', horizontal: this.width === 'sm' ? 'center' : 'right' }}
        open={this.opened}
        onClose={this.onClose}
        autoHideDuration={5000}
        message={this.opened && this.current && this.current.message as any || undefined}
        action={this.opened && this.current && this.current.action ? (
          <Button color="secondary" size="small" onClick={this.performAction}>
            {this.current.action.content}
          </Button>
        ) : undefined}
        onExited={this.onExited}
      />
    );
  }

  @action.bound
  private onClose(event: React.SyntheticEvent<any>, reason: string) {
    if (reason === 'clickaway')
      return;
    this.opened = false;
  }

  @action.bound
  private performAction() {
    if (this.current && this.current.action)
      this.current.action.fn();
    this.opened = false;
  }

  @action.bound
  private onExited() {
    this.current = AppNotifications.pending;
    AppNotifications.pending = undefined;
    this.opened = !!this.current;
  }
}