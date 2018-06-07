import { existsSync } from 'fs';
import { analyze } from './analyzer';

function usage() {
  console.log(`
usage: dungeon-analysis [path to data directory]
`.trim());
  return false;
}

async function main(args: string[]) {
  const dataPath = args[0];
  if (!existsSync(dataPath)) {
    return usage();
  }

  await analyze(dataPath);
  return true;
}

main(process.argv.slice(2)).then(ok => process.exit(ok ? 0 : 1)).catch(err => {
  console.error('\nunexpected error: ', err);
  process.exit(1);
});