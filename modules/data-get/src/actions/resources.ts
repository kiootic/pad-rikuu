import { downloadExtras } from '../stages/download-extras';
import { downloadImages } from '../stages/download-images';
import { downloadPj } from '../stages/download-pj';
import { downloadRoot } from '../stages/download-root';

export async function main(args: string[]) {
  const { rootPath, rootJson } = await downloadRoot();
  if (!rootJson)
    return false;

  if (!await downloadPj(rootPath, rootJson.padinfo))
    return false;
  if (!await downloadImages(rootPath, rootJson.extlist))
    return false;
  if (!await downloadExtras(rootPath, rootJson.efl))
    return false;

  return true;
}