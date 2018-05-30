import { Grow, Paper } from '@material-ui/core';
import { action, observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './HoverPopup.css';

export interface HoverPopupProps {
  className?: string;
  header: React.ReactElement<any>;
  direction?: 'left' | 'right';
}

@observer
export class HoverPopup<T> extends React.Component<HoverPopupProps> {
  @observable
  private opened = false;

  @observable
  private popupOpened = false;

  private headerElem: HTMLElement | null;
  private elem = document.createElement('div');

  public componentDidMount() {
    this.elem.classList.add('HoverPopup-popup-root');
  }

  public componentWillUnmount() {
    this.elem.remove();
  }

  public render() {
    if (this.popupOpened && !this.elem.parentElement) {
      document.body.appendChild(this.elem);
    } else if (!this.popupOpened) {
      this.elem.remove();
    }

    if (this.popupOpened && this.headerElem) {
      const rect = this.headerElem.getBoundingClientRect();
      const left = window.pageXOffset + (this.props.direction === 'left' ? rect.right : rect.left);
      const top = window.pageYOffset + rect.bottom;
      this.elem.style.left = `${left}px`;
      this.elem.style.top = `${top}px`;
    }

    return (
      <div className={`${this.props.className || ''} HoverPopup-root`}
        onMouseEnter={this.open} onMouseLeave={this.close} ref={elem => this.headerElem = elem}
      >
        {this.props.header}
        {this.popupOpened && ReactDOM.createPortal(
          <Grow in={this.opened} onExited={this.exit}>
            <Paper elevation={8} className={`HoverPopup-popup HoverPopup-popup-${this.props.direction || 'right'}`}>
              {this.props.children}
            </Paper>
          </Grow>, this.elem)
        }
      </div>
    );
  }

  @action.bound
  private open() { this.opened = true; this.popupOpened = true; }
  @action.bound
  private close() { this.opened = false; }
  @action.bound
  private exit() { this.popupOpened = false; }
}