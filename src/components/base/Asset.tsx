import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { Store } from 'src/store';
import { getDevicePixelRatio } from 'src/utils';

export interface AssetProps extends React.HTMLAttributes<HTMLDivElement> {
  store?: Store;
  className?: string;
  assetId: string;
}

// tslint:disable-next-line:no-shadowed-variable
export const Asset = inject('store')(observer((function Asset(props: AssetProps) {
  const asset = props.store && props.store.assets.lookup(props.assetId);
  if (!asset) throw new Error(`asset '${props.assetId}' does not exist`);

  const imgProps = Object.assign({}, props);
  delete imgProps.store;
  delete imgProps.assetId;

  const ratio = getDevicePixelRatio();
  return (
    <span {...imgProps} style={{
      ...imgProps.style,
      display: 'inline-block',
      backgroundImage: `url(${asset.image.src})`,
      backgroundPosition: `-${asset.x / ratio}px -${asset.y / ratio}px`,
      width: asset.width / ratio,
      height: asset.height / ratio,
      backgroundSize: `${asset.image.width / ratio}px ${asset.image.height / ratio}px`
    }} />
  );
})));