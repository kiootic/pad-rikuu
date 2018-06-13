import { camelCase, kebabCase } from 'lodash';
import { api, demanglePlayerID, RegionID, VersionString } from '../api';
import { exists, formatJson, mkdir, readFile, writeTo } from '../common';

export async function downloadGameData(rootPath: string, apiUrl: string) {
  console.log(`downloading game data: ${apiUrl}`);
  const basePath = mkdir(rootPath, 'game');

  const session = await api.fetchApi(apiUrl, 'login',
    { t: '1' },
    { v: VersionString },
    { u: api.config.secret },
    { i: 0 },
    { p: RegionID.toLowerCase() },
    { dev: api.config.device },
    { osv: api.config.osVersion },
  );
  const { id: pid, sid } = session;
  console.log(`player ID: ${demanglePlayerID(pid)}`);
  const playerPath = mkdir(basePath, demanglePlayerID(pid));
  writeTo(formatJson(session), playerPath, 'session.json');

  const player = await api.fetchApi(apiUrl, 'get_player_data',
    { pid }, { sid },
    { v: 2 },
  );
  writeTo(formatJson(player), playerPath, 'player.json');
  console.log(`rank: ${player.lv}`);
  console.log(`stamina: ${player.sta_max}`);

  const info: any = { pid, sid, player };
  const version = {};
  async function dlData(name: string, verKey: string, fn: () => Promise<any>) {
    console.log(`downloading ${name}...`);
    info[camelCase(name)] = player[verKey];
    version[kebabCase(name)] = player[verKey];

    mkdir(basePath, kebabCase(name));
    if (exists(basePath, kebabCase(name), `${player[verKey]}.json`)) {
      console.log('up to date.');
      return;
    }

    const data = await fn();
    writeTo(formatJson(data), basePath, kebabCase(name), `${player[verKey]}.json`);
  }

  await dlData('cards', 'cver', () => api.fetchApi(apiUrl, 'download_card_data',
    { pid }, { sid },
    { v: 3 },
  ));

  await dlData('dungeons', 'dver', () => api.fetchApi(apiUrl, 'download_dungeon_data',
    { pid }, { sid },
    { v: 2 },
  ));

  await dlData('skills', 'sver', () => api.fetchApi(apiUrl, 'download_skill_data',
    { pid }, { sid },
    { ver: 1 },
  ));

  await dlData('events', 'pver', () => api.fetchApi(apiUrl, 'download_limited_bonus_data',
    { pid }, { sid },
    { v: 2 },
  ));

  await dlData('enemy skills', 'msver', () => api.fetchApi(apiUrl, 'download_enemy_skill_data',
    { pid }, { sid },
    { ver: 0 },
  ));

  await dlData('dungeon shop', 'dsver', () => api.fetchApi(apiUrl, 'get_dung_sale',
    { pid }, { sid },
  ));

  await dlData('mp shop', 'psver', () => api.fetchApi(apiUrl, 'shop_item',
    { pid }, { sid },
  ));

  await dlData('quests', 'alver', () => api.fetchApi(apiUrl, 'dl_al',
    { pid }, { sid },
  ));

  await dlData('monster exchange', 'mever', () => api.fetchApi(apiUrl, 'mdatadl',
    { pid }, { sid },
    { dtp: 0 },
  ));

  const oldVersion = JSON.parse((await readFile(basePath, `version.json`)).toString('utf8'));
  writeTo(formatJson({ ...oldVersion, ...version }), basePath, `version.json`);
  return { info, basePath };
}
