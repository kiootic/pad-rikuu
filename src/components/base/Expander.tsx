import { Button, Fade, Typography } from '@material-ui/core';
import { action, observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import './Expander.css';

export interface ExpanderProps {
  header: React.ReactNode;
}

@observer
export class Expander<T> extends React.Component<ExpanderProps> {
  @observable
  private opened = false;

  public render() {
    return (
      <div className="Expander-root">
        <Button disableRipple={true} onClick={this.toggle}>
          <Typography variant="caption" className={`Expander-header Expander-${this.opened ? 'opened' : 'closed'}`}>
            {this.props.header}
          </Typography>
        </Button>
        <Fade in={this.opened}>
          <div className={`Expander-content Expander-${this.opened ? 'opened' : 'closed'}`}>
            {this.props.children}
          </div>
        </Fade>
      </div >
    );
  }

  @action.bound
  private toggle(e: React.MouseEvent<HTMLElement>) {
    e.currentTarget.focus();
    this.opened = !this.opened;
  }
}