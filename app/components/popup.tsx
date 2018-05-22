import React from 'react';
import css from 'styles/components/popup.scss';

export function Popup(props: {
  className?: string,
  direction?: 'left' | 'right',
  header: React.ReactNode,
  children: React.ReactNode
}) {
  const direction = props.direction || 'left';
  return <div className={css.container}>
    <div className={css.header}>
      {props.header}
    </div>
    <div className={`${css.popup} ${css[direction]}`}>
      {props.children}
    </div>
  </div>;
}