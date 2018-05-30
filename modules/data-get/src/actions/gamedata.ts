import { api } from '../api';
import { downloadGameData } from '../stages/download-gamedata';
import { downloadRoot } from '../stages/download-root';
import { parseCards } from '../stages/parse-cards';
import { parseDungeons } from '../stages/parse-dungeons';
import { parseEnemySkills } from '../stages/parse-enemyskills';
import { parseEvents } from '../stages/parse-events';
import { parseExchange } from '../stages/parse-exchange';
import { parseQuests } from '../stages/parse-quests';
import { parseShops } from '../stages/parse-shops';
import { parseSkills } from '../stages/parse-skills';

export async function main(args: string[]) {
  if (!api.exists) {
    console.log('API implementation not found');
    return false;
  }
  const { rootPath, rootJson } = await downloadRoot();
  if (!rootJson)
    return false;

  const { basePath, info } = await downloadGameData(rootPath, rootJson.base);

  if (!await parseCards(basePath, info))
    return false;
  if (!await parseSkills(basePath, info))
    return false;
  if (!await parseDungeons(basePath, info))
    return false;
  if (!await parseEnemySkills(basePath, info))
    return false;
  if (!await parseEvents(basePath, info))
    return false;
  if (!await parseShops(basePath, info))
    return false;
  if (!await parseQuests(basePath, info))
    return false;
  if (!await parseExchange(basePath, info))
    return false;

  return true;
}