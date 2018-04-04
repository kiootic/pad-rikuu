import React from 'react';
import { Store } from 'app/store';

export function Asset(props: { className?: string, assetKey: string }) {
  const asset = Store.instance.assetDB.assets.get(props.assetKey);
  if (!asset) throw new Error(`asset '${props.assetKey}' does not exist`);
  return <img src={asset.image.src} className={props.className}
    style={{
      objectFit: 'none',
      objectPosition: `-${asset.x}px -${asset.y}px`,
      width: asset.width,
      height: asset.height
    }} />;
}