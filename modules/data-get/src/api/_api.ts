export interface PlayerInfo {
  pid: string;
  sid: string;
  player: any;
}

export interface WaveData {
  time: string;
  dungeon: number;
  floor: number;
  data: string;
}

let api: undefined | {
  config: {
    secret: string,
    device: string,
    osVersion: string
  },
  fetchApi(apiUrl: string, action: string, ...query: Array<{ [name: string]: any }>): Promise<any>,
  computeKey(value: string, rand?: number): Promise<number>,
  decodeData(input: string): string,
  encodeData(input: string, rand?: number): string,
  dlWave(dungeon: number, floor: number, apiUrl: string, info: PlayerInfo): Promise<WaveData>,
};

try {
  // tslint:disable-next-line:no-var-requires
  api = require('./api');
} catch (e) {
  api = undefined;
}

export const exists = !!api;

export const config = (api && api.config)!;
export const fetchApi = (api && api.fetchApi)!;
export const computeKey = (api && api.computeKey)!;
export const decodeData = (api && api.decodeData)!;
export const encodeData = (api && api.encodeData)!;
export const dlWave = (api && api.dlWave)!;