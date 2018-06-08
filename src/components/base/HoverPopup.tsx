import { Grow, Paper } from '@material-ui/core';
import { action, observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './HoverPopup.css';

export interface HoverPopupProps {
  className?: string;
  header: React.ReactElement<any>;
}

@observer
export class HoverPopup<T> extends React.Component<HoverPopupProps> {
  private static touchEventInitialized = false;
  @observable
  private static touching = false;

  @observable
  private opened = false;

  @observable
  private popupOpened = false;

  @observable private mouseX = 0;
  @observable private mouseY = 0;

  private headerElem: HTMLElement | null;
  private readonly elem = document.createElement('div');

  public componentDidMount() {
    this.elem.classList.add('HoverPopup-popup-root');
    if (!HoverPopup.touchEventInitialized) {
      document.addEventListener('touchstart', action(() => HoverPopup.touching = true));
      document.addEventListener('touchend', action((e: TouchEvent) => HoverPopup.touching = e.targetTouches.length === 0));
      HoverPopup.touchEventInitialized = true;
    }
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
      const left = this.mouseX;
      const top = this.mouseY;
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
            <Paper elevation={8} className="HoverPopup-popup">
              {this.props.children}
            </Paper>
          </Grow>, this.elem)
        }
      </div>
    );
  }

  @action.bound
  private open(e: React.MouseEvent<HTMLElement>) {
    if (HoverPopup.touching) return;
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