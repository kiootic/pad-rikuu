import { inject } from 'mobx-react';
import * as React from 'react';
import { Store } from '../../store';

export interface AssetProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  store?: Store;
  className?: string;
  assetId: string;
}

// tslint:disable-next-line:no-shadowed-variable
export const Asset = inject('store')(function Asset(props: AssetProps) {
  const asset = props.store && props.store.assets.lookup(props.assetId);
  if (!asset) throw new Error(`asset '${props.assetId}' does not exist`);

  const imgProps = Object.assign({}, props);
  delete imgProps.store;
  delete imgProps.assetId;
  return (
    <img {...imgProps} src={asset.image.src} style={{
      ...imgProps.style,
      objectFit: 'none',
      objectPosition: `-${asset.x}px -${asset.y}px`,
      width: asset.width,
      height: asset.height
    }} />
  );
});