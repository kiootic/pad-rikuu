import * as fs from 'fs';
import { sync as mkdirp } from 'mkdirp';
import * as path from 'path';
import { parse as parseUrl } from 'url';

export function promisify<T>(fn: (cb: (err: any, result: T) => void) => void) {
  return new Promise<T>((resolve, reject) => {
    fn((err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

export function mkdir(...parts: string[]) {
  const dir = path.join(...parts);
  if (!fs.existsSync(dir))
    mkdirp(dir);
  return dir;
}

export function mkdirIfExists(...parts: string[]) {
  const dir = path.join(...parts);
  if (fs.existsSync(dir))
    return null;

  mkdirp(dir);
  return dir;
}

export function exists(...parts: string[]) {
  return fs.existsSync(path.join(...parts));
}

export function writeTo(data: any, ...parts: string[]) {
  fs.writeFileSync(path.join(...parts), data);
}

export function readFile(...parts: string[]): Promise<Buffer> {
  return promisify(cb => fs.readFile(path.join(...parts), cb));
}

export function fileName(url: string) {
  return path.basename(parseUrl(url).pathname!);
}

export function urlSegments(url: string) {
  return parseUrl(url).pathname!.split('/');
}

export function formatJson(obj: any) {
  return JSON.stringify(obj, null, 4);
}

export function readASCII(buf: Buffer, offset: number) {
  let str = '';
  while (buf[offset] !== 0)
    str += String.fromCharCode(buf[offset++]);
  return str;
}

export function readFixed(buf: Buffer, offset: number, size: number) {
  return buf.slice(offset, offset + size).toString().replace(/\0*$/g, '');
}

const MaxConcurrency = 10;
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
export function queueWork<T>(fn: () => Promise<T>): Promise<T> {
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

export function allWithProgress<T>(promises: Array<Promise<T>>, progress: (done: number, total: number) => void) {
  const total = promises.length;
  let done = 0;
  progress(done, total);
  const report = () => {
    process.stdout.write('\r');
    progress(++done, total);
    if (done === total)
      process.stdout.write('\n');
  };
  return Promise.all(promises.map(promise => promise.then(
    result => {
      report(); return result;
    },
    error => {
      report(); throw error;
    }
  )));
}
