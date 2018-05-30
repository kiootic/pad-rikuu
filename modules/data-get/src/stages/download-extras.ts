import Axios from 'axios';
import { allWithProgress, formatJson, mkdirIfExists, queueWork, readASCII, urlSegments, writeTo } from '../common';

interface Entry {
  name: string;
  lastUpdate: number;
}

export async function downloadExtras(rootPath: string, dataUrl: string) {
  console.log(`downloading extras: ${dataUrl}`);
  const v = urlSegments(dataUrl).find(seg => seg.startsWith('extf'))!;
  const basePath = mkdirIfExists(rootPath, 'extras', v);
  writeTo(Buffer.from(v, 'utf8'), rootPath, 'extras', 'current');
  if (!basePath) {
    console.log('up to date.');
    return true;
  }

  const indexData: Buffer = await Axios.get('extdllist.bin', {
    baseURL: dataUrl,
    responseType: 'arraybuffer'
  }).then(resp => resp.data);
  writeTo(indexData, basePath, 'extdllist.bin');

  const sig = indexData.readUInt32LE(0);
  const numEntries = indexData.readUInt32LE(4);
  if (sig !== 0x32465845) {// EXF2
    console.error('invalid extdllist.bin signature');
    return false;
  }
  console.log(`entries: ${numEntries}`);

  const entries: Entry[] = [];
  for (let i = 0; i < numEntries; i++) {
    const lastUpdate = indexData.readUInt32LE(0x10 + i * 0x10 + 4);
    const nameOffset = indexData.readUInt32LE(0x10 + i * 0x10 + 12);
    entries.push({ lastUpdate, name: readASCII(indexData, nameOffset) });
  }
  writeTo(formatJson(entries), basePath, 'extdllist.json');

  const tasks = entries.map(entry => queueWork(async () => {
    try {
      const resp = await Axios.get(entry.name, {
        baseURL: dataUrl,
        responseType: 'arraybuffer'
      });
      await writeTo(resp.data, basePath, entry.name);
    } catch (err) {
      if (err.response && err.response.status === 404)
        console.error(`\nfailed to download '${entry.name}'`);
      else throw err;
    }
  }));
  await allWithProgress(tasks, (done, total) => process.stdout.write(`downloading: ${done}/${total}`));
  return true;
}
