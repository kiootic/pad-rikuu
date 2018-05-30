import Axios from 'axios';
import { RegionID, RootJson, VersionString } from '../api';
import { fileName, formatJson, mkdir, writeTo } from '../common';

export async function downloadRoot() {
  console.log(`region: ${RegionID}`);
  console.log(`version: ${VersionString}`);
  const rootPath = mkdir('data', RegionID);

  console.log(`downloading root json: ${RootJson}`);
  const rootJson = await Axios.get(RootJson).then(resp => resp.data);
  writeTo(formatJson(rootJson), rootPath, fileName(RootJson));
  if (rootJson.rver !== VersionString) {
    console.log(`server version: ${rootJson.rver}`);
    console.error('version mismatch');
    return { rootPath, rootJson: null };
  }
  return { rootPath, rootJson };
}