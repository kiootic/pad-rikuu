import { readFileSync, writeFileSync } from 'fs';
import { sync as mkdirp } from 'mkdirp';
import { join } from 'path';

const MaxConcurrency = 5;
const workQueue: Array<{ resolve: (result: any) => void, reject: (error: any) => void, fn: (() => Promise<any>) }> = [];
let activeWorks = 0;
function onWorkDone() {
  activeWorks--;
  if (workQueue.length > 0 && activeWorks < MaxConcurrency) {
    activeWorks++;
    const { resolve, reject, fn } = workQueue.shift()!;
    fn().then(
      result => {
        onWorkDone();
        resolve(result);
      },
      err => reject(err));
  }
}
function queueWork<T>(fn: () => Promise<T>): Promise<T> {
  if (activeWorks < MaxConcurrency) {
    activeWorks++;
    return fn().then(
      result => {
        onWorkDone();
        return result;
      },
      err => {
        onWorkDone();
        throw err;
      });
  } else {
    return new Promise((resolve, reject) => {
      workQueue.push({ resolve, reject, fn });
    });
  }
}

async function optimizeFile(path: string) {
  const [, type, name, ext] = /\/([^\/]*)\/([^\/]*)\.([^.]*)$/.exec(path)!;

  if (ext.toLowerCase() === 'json' || ext.toLowerCase() === 'png')
    console.log(`${type}/${name}.${ext}`);

  if (ext.toLowerCase() === 'json') {
    let data = readFileSync(path);
    data = Buffer.from(JSON.stringify(JSON.parse(data.toString('utf8'))), 'utf8');
    writeFileSync(join('data', 'images', `${name}.json`), data);
    return `${name}.json`;
  } else if (ext.toLowerCase() === 'png') {
    let data = readFileSync(path);
    writeFileSync(join('data', 'images', `${name}.png`), data);
    return `${name}.png`;
  }
  return undefined;
}

export async function optimizeImages(dataPath: string) {
  mkdirp(join('data', 'images'));
  const current = readFileSync(join(dataPath, 'images', 'current')).toString('utf8');
  const basePath = join(dataPath, 'images', current);

  const extlist: { isCards: boolean, files: string[] }[] = JSON.parse(
    readFileSync(join(basePath, 'extlist.json')).toString('utf8')
  );
  await Promise.all(extlist
    .map(async entry => {
      const type = entry.isCards ? 'cards' : 'mons';
      const newFiles: string[] = [];
      for (const file of entry.files) {
        const newFile = await queueWork(() => optimizeFile(join(basePath, type, file)));
        if (newFile)
          newFiles.push(newFile);
      }
      entry.files = newFiles;
    })
  );
  writeFileSync(join('data', 'images', 'extlist.json'), JSON.stringify(extlist));
}