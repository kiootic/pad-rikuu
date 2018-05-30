import Axios from 'axios';
import { fileName, formatJson, mkdir, writeTo } from '../common';

export async function downloadPj(basePath: string, pj: string) {
  console.log(`downloading pj: ${pj}`);
  mkdir(basePath, 'pj');

  const resp = await Axios.get(pj);
  writeTo(formatJson(resp.data), basePath, 'pj', fileName(pj));
  return true;
}
