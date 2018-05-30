declare module 'node-apk-parser' {
  import Zip from 'adm-zip';

  class APK {
    constructor(file: string);

    readonly zip: Zip;
    readManifestSync(): Record<string, string>;
  }

  export = APK;
}