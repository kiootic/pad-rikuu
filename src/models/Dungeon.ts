export interface Dungeon {
  id: number;
  name: string;
  once: boolean;
  bgId: number;
  type: number;
  weekday: number;
  order: number;
  floors: Floor[];
}

export interface Floor {
  id: number;
  name: string;
  waves: number;
  rflags1: number;
  stamina: number;
  bgm1: number;
  bgm2: number;
  rflags2: number;
  flags: number;

  requirement?: {
    dungeonId: number;
    floorId: number;
  };
  beginTime?: string;
  score?: number;
  minRank?: number;
  properties?: string[];
  conditions? : {
    type: number;
    values: number[];
  };
}