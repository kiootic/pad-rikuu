import { readdirSync } from 'fs';
import { range } from 'lodash';
import { formatJson, mkdir, readFile, readFixed, writeTo } from '../common';
import { decodeTexRaw, isValidTex } from '../texture';

export async function decodeAPK(basePath: string) {
  console.log('decoding APK assets...');
  let numAssets = 0;
  await Promise.all(
    readdirSync(mkdir(basePath, 'data'))
      .map(async asset => {
        const data = await readFile(basePath, 'data', asset);
        if (!isValidAsset(data)) return;

        const key = asset.replace(/\..*$/, '');
        const texs = await decodeAsset(data, key);

        console.log(asset);
        mkdir(basePath, 'assets', asset);
        for (const name of Object.keys(texs)) {
          console.log('\t' + name);
          writeTo(texs[name], basePath, 'assets', asset, name);
        }
        numAssets++;
      })
  );
  console.log(`${numAssets} assets decoded`);
}

function isValidAsset(data: Buffer) {
  return readFixed(data, 0, 4) === 'DMSG' || isValidTex(data);
}

async function decodeAsset(data: Buffer, key: string) {
  if (readFixed(data, 0, 4) !== 'DMSG')
    return await decodeTexRaw(data, { key, width: 0, height: 0 });

  const numMsgs = data.readUInt16LE(6);
  const messages = [];
  for (const i of range(numMsgs)) {
    const offset = data.readUInt32LE(8 + i * 4);
    if (offset === 0) {
      messages.push('');
    } else {
      const end = data.indexOf(0, offset);
      messages.push(data.slice(offset, end).toString('utf8'));
    }
  }
  return { [`${key}.json`]: Buffer.from(formatJson(messages), 'utf8') };
}