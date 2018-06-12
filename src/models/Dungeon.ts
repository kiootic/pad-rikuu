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
  rflags1: RFlags1;
  stamina: number;
  bgm1: number;
  bgm2: number;
  rflags2: RFlags2;
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

export enum RFlags1 {
  NoLight = 0x20,
  NoDark = 0x40,
  Technical = 0x80,
  SkillCharged = 0x100,
  Scoring = 0x200
}

export enum RFlags2 {
  NoFire = 1,
  NoWater = 2,
  NoWood = 4,
  NoLight = 8,
  NoDark = 0x10,
  NoHeart = 0x20,

  NoActiveSkill = 0x40,
  NoLeaderSkill = 0x80,
  NoContinue = 0x100,
  NoRewards = 0x200,
  NoAwokenSkill = 0x400,
}