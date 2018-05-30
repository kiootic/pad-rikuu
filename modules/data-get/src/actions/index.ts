import { main as apk } from './apk';
import { main as gamedata } from './gamedata';
import { main as resources } from './resources';
import { main as waves } from './waves';

type Action = (args: string[]) => Promise<boolean>;

export const actions: Record<string, Action> = {
  apk,
  resources,
  gamedata,
  waves
};