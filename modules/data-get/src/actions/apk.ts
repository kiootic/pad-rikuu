import APK from 'node-apk-parser';
import { exists, mkdir } from '../common';
import { decodeAPK } from '../stages/decode-apk';
import { extractAPK } from '../stages/extract-apk';

export async function main(args: string[]) {
  const apkPath = args[0];
  if (!exists(apkPath)) {
    console.error('apk not found');
    return false;
  }

  const apk = new APK(apkPath);
  const manifest = apk.readManifestSync();
  const { package: packageName, versionName } = manifest;
  console.log(`package: ${packageName}`);
  console.log(`version: ${versionName}`);
  const basePath = mkdir('data', 'apk', packageName, versionName);

  extractAPK(basePath, apk);
  await decodeAPK(basePath);

  return true;
}