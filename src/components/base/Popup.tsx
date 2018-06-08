import { Grow, Paper } from '@material-ui/core';
import { action, observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { bound } from 'src/utils';
import './Popup.css';

export interface PopupProps {
  className?: string;
  header: React.ReactElement<any>;
  anchor?: 'left' | 'right' | 'action';

  opened?: boolean;
  open?: () => void;
  close?: () => void;
}

@observer
export class Popup<T> extends React.Component<PopupProps> {
  @observable
  private opened = false;

  @observable
  private popupOpened = false;

  private headerElem: HTMLElement | null;
  private readonly elem = document.createElement('div');

  public componentDidMount() {
    this.elem.classList.add('Popup-popup-root');
  }

  public componentWillUnmount() {
    this.elem.remove();
    document.removeEventListener('click', this.onDocumentClick);
  }

  public render() {
    const opened = typeof this.props.opened === 'undefined' ? this.opened : this.props.opened;
    const popupOpened = opened || this.popupOpened;

    if (popupOpened && !this.elem.parentElement) {
      document.body.appendChild(this.elem);
    } else if (!popupOpened && this.elem.parentElement) {
      this.elem.remove();
    }

    if (popupOpened && this.headerElem) {
      const rect = this.headerElem.getBoundingClientRect();
      let top;
      if (this.props.anchor === 'action') {
        top = rect.bottom;
        this.elem.style.right = '0';
        this.elem.style.position = 'fixed';
      } else {
        top = window.pageYOffset + rect.bottom;

        const left = window.pageXOffset + (this.props.anchor === 'left' ? rect.right : rect.left);
        this.elem.style.left = `${left}px`;
      }
      this.elem.style.top = `${top}px`;
    }

    return (
      <div className={`${this.props.className || ''} Popup-root`} ref={elem => this.headerElem = elem}
      >
        <div onClick={this.open}>{this.props.header}</div>
        {popupOpened && ReactDOM.createPortal(
          <Grow in={opened} onEntering={this.opening} onExited={this.exited}>
            <Paper elevation={8} className={`Popup-popup Popup-popup-${this.props.anchor || 'right'}`}>
              {this.props.children}
            </Paper>
          </Grow>, this.elem)
        }
      </div>
    );
  }

  @action.bound
  private open() {
    if (this.props.open) this.props.open();
    else this.opened = true;
  }
  @action.bound
  private close() {
    if (this.props.close) this.props.close();
    else this.opened = false;
  }

  @action.bound
  private opening() {
    this.popupOpened = true;
    document.addEventListener('click', this.onDocumentClick);
  }
  @action.bound
  private exited() {
    this.popupOpened = false;
    document.removeEventListener('click', this.onDocumentClick);
  }

  @bound
  private onDocumentClick(e: PointerEvent) {
    const target = e.target as HTMLElement;
    if (this.elem.contains(target))
      return;
    this.close();
  }
}