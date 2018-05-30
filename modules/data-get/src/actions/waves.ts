import { api } from '../api';
import { downloadGameData } from '../stages/download-gamedata';
import { downloadRoot } from '../stages/download-root';
import { downloadWaves } from '../stages/download-waves';

export async function main(args: string[]) {
  if (!api.exists) {
    console.log('API implementation not found');
    return false;
  }
  const { rootPath, rootJson } = await downloadRoot();
  if (!rootJson)
    return false;

  const { basePath, info } = await downloadGameData(rootPath, rootJson.base);

  if (!await downloadWaves(basePath, rootJson.base, info))
    return false;

  return true;
}