import Axios from 'axios';
import { padStart } from 'lodash';
import { allWithProgress, formatJson, mkdir, queueWork, writeTo, exists, readFile } from '../common';
import { decodeTex } from '../texture';
import { sync as rimraf } from 'rimraf';
import { join } from 'path';
/* tslint:disable:no-bitwise */

interface Entry {
  key: string;
  isCards: boolean;
  id: number;
  width: number;
  height: number;
  lastUpdate: number;

  frames: number;
  files?: string[];
}

export async function downloadImages(rootPath: string, dataUrl: string) {
  console.log(`downloading images: ${dataUrl}`);

  rootPath = mkdir(rootPath, 'images');
  mkdir(rootPath, 'cache');
  rimraf(join(rootPath, 'raw'));
  rimraf(join(rootPath, 'cards'));
  rimraf(join(rootPath, 'mons'));
  mkdir(rootPath, 'raw');
  mkdir(rootPath, 'cards');
  mkdir(rootPath, 'mons');

  const indexData: Buffer = await Axios.get('extlist.bin', {
    baseURL: dataUrl,
    responseType: 'arraybuffer'
  }).then(resp => resp.data);
  writeTo(indexData, rootPath, 'extlist.bin');

  const numMons = indexData.readUInt32LE(0);
  const numCards = indexData.readUInt32LE(4);
  const sig = indexData.readUInt32LE(8);
  if (sig !== 0x31545845) {  // EXT1
    console.error('invalid extlist.bin signature');
    return false;
  }
  console.log(`monsters: ${numMons}, cards: ${numCards}`);

  const entries: Entry[] = [];
  for (let i = 0; i < numMons + numCards; i++) {
    const flags = indexData.readUInt16LE(0x10 + i * 24 + 0);
    const isCards = (flags & 0x4000) !== 0;
    const id = flags & ~0x4000;
    if (id === 0) continue;

    const width = indexData.readUInt16LE(0x10 + i * 24 + 6);
    const height = indexData.readUInt16LE(0x10 + i * 24 + 8);
    const frames = indexData.readUInt16LE(0x10 + i * 24 + 10);
    const lastUpdate = indexData.readUInt32LE(0x10 + i * 24 + 20);
    const key = `${isCards ? 'cards' : 'mons'}_${padStart(id.toString(), 3, '0')}`;
    entries.push({ key, isCards, id, width, height, frames, lastUpdate });
  }
  writeTo(formatJson(entries), rootPath, 'extlist.json');

  function extractETag(etag: string) {
    return /^(?:W\/)?"([^"]+)"$/.exec(etag)![1];
  }
  const tasks = entries.map(entry => queueWork(async () => {
    const respHead = await Axios.head(`${entry.key}.bc`, { baseURL: dataUrl });
    let etag = extractETag(respHead.headers.etag);
    let data: Buffer;

    if (exists(rootPath, 'cache', etag)) {
      data = await readFile(rootPath, 'cache', etag);
    } else {
      const resp = await Axios.get(`${entry.key}.bc`, {
        baseURL: dataUrl,
        responseType: 'arraybuffer'
      });
      etag = extractETag(resp.headers.etag);
      data = resp.data;
      await writeTo(data, rootPath, 'cache', etag);
    }

    await writeTo(data, rootPath, 'raw', `${entry.key}.bc`);
    return data;
  }).then(async data => {
    try {
      const texs = await decodeTex(data, entry);
      for (const name of Object.keys(texs)) {
        writeTo(texs[name], rootPath, entry.isCards ? 'cards' : 'mons', name);
      }
      entry.files = Object.keys(texs);
    } catch (err) {
      console.error(`\nfailed to decode ${entry.key}: `, err);
    }
  }));
  await allWithProgress(tasks, (done, total) => process.stdout.write(`downloading: ${done}/${total}`));
  writeTo(formatJson(entries), rootPath, 'extlist.json');

  return true;
}
