import * as React from 'react';
import './AssetBox.css';

const TransparentImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

export interface AssetBoxProps {
  title?: string;
  className?: string;
  children: React.ReactNode;
}

export function AssetBox(props: AssetBoxProps) {
  return (
    <span className={`${props.className || ''} AssetBox-root`}>
      {props.children}
      {props.title && <img className="AssetBox-title" title={props.title} src={TransparentImage} />}
    </span>
  );
}