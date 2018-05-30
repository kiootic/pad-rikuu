import { range } from 'lodash';
import APK from 'node-apk-parser';
import { mkdir, readFixed, writeTo } from '../common';

export function extractAPK(basePath: string, apk: APK) {
  const zip = apk.zip;
  const dataIndex = zip.getEntry('assets/DATA000.BIN').getData();
  const dataNames = zip.getEntry('assets/DATA000.NAM').getData();

  const headerSize = dataIndex.readUInt32LE(0);
  const numBins = dataIndex.readUInt32LE(4);
  const numEntries = dataIndex.readUInt32LE(8);

  const bins: Buffer[] = [];
  console.log(`${numBins} binary files:`);
  mkdir(basePath, 'bin');
  for (const i of range(numBins)) {
    const name = readFixed(dataIndex, 0x20 + i * 0x10, 0x10);
    console.log(name);
    const data = zip.getEntry(`assets/${name}`).getData();
    bins.push(data);
    writeTo(data, basePath, 'bin', name);
  }

  console.log(`${numEntries} entries:`);
  mkdir(basePath, 'data');
  let numAssets = 0;
  for (const i of range(numEntries)) {
    const name = readFixed(dataNames, i * 0x10, 0x10);
    const flags = dataIndex[headerSize + i * 0x10 + 0];
    const binIndex = dataIndex[headerSize + i * 0x10 + 2];

    const sizeCompressed = dataIndex.readUInt32LE(headerSize + i * 0x10 + 4);
    const offset = dataIndex.readUInt32LE(headerSize + i * 0x10 + 8);
    const sizeUncompressed = dataIndex.readUInt32LE(headerSize + i * 0x10 + 12);

    if (flags !== 0) continue; // in-game download
    if (sizeUncompressed === 0) continue;

    console.log(`${name} @ ${binIndex} ( ${offset} ${sizeCompressed})`);
    const data = bins[binIndex].slice(offset, offset + sizeCompressed);
    writeTo(data, basePath, 'data', name);
    numAssets++;
  }
  console.log(`extracted ${numAssets} data files.`);
}