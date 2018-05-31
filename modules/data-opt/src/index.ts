import { existsSync } from 'fs';
import { optimizeGameData } from './opt-gamedata';
import { optimizeImages } from './opt-images';

function usage() {
  console.log(`
usage: data-opt [path to data directory]
`.trim());
  return false;
}

async function main(args: string[]) {
  const dataPath = args[0];
  if (!existsSync(dataPath)) {
    return usage();
  }
  
  optimizeGameData(dataPath);
  await optimizeImages(dataPath);
  return true;
}

main(process.argv.slice(2)).then(ok => process.exit(ok ? 0 : 1)).catch(err => {
  console.error('\nunexpected error: ', err);
  process.exit(1);
});