import { Grow, Paper } from '@material-ui/core';
import { action, observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './HoverPopup.css';

export interface HoverPopupProps {
  className?: string;
  header: React.ReactElement<any>;
  anchor?: 'left' | 'right' | 'pointer';
}

@observer
export class HoverPopup<T> extends React.Component<HoverPopupProps> {
  @observable
  private opened = false;

  @observable
  private popupOpened = false;

  @observable private mouseX = 0;
  @observable private mouseY = 0;

  private headerElem: HTMLElement | null;
  private elem = document.createElement('div');

  public componentDidMount() {
    this.elem.classList.add('HoverPopup-popup-root');
  }

  public componentWillUnmount() {
    this.elem.remove();
    document.body.removeEventListener('pointermove', this.onPointerMove);
  }

  public render() {
    if (this.popupOpened && !this.elem.parentElement) {
      document.body.appendChild(this.elem);
      document.body.addEventListener('pointermove', this.onPointerMove);
    } else if (!this.popupOpened && this.elem.parentElement) {
      this.elem.remove();
      document.body.removeEventListener('pointermove', this.onPointerMove);
    }

    if (this.popupOpened && this.headerElem) {
      let left;
      let top;
      if (this.props.anchor === 'pointer') {
        left = this.mouseX;
        top = this.mouseY;
        this.elem.style.position = 'fixed';
      } else {
        const rect = this.headerElem.getBoundingClientRect();
        left = window.pageXOffset + (this.props.anchor === 'left' ? rect.right : rect.left);
        top = window.pageYOffset + rect.bottom;
        this.elem.style.position = 'absolute';
      }
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
            <Paper elevation={8} className={`HoverPopup-popup HoverPopup-popup-${this.props.anchor || 'right'}`}>
              {this.props.children}
            </Paper>
          </Grow>, this.elem)
        }
      </div>
    );
  }

  @action.bound
  private open(e : React.MouseEvent<HTMLElement>) {
     this.opened = true; 
     this.popupOpened = true;
     this.mouseX = e.clientX;
     this.mouseY = e.clientY;
   }
  @action.bound
  private close() { this.opened = false; }
  @action.bound
  private exit() { this.popupOpened = false; }

  @action.bound
  private onPointerMove(e: MouseEvent) {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
  }
}