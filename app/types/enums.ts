export enum Attrs {
  Fire = 0,
  Water = 1,
  Wood = 2,
  Light = 3,
  Dark = 4,
  Heart = 5,
  Jammer = 6,
  Poison = 7,
  MPoison = 8,
}

export namespace Attrs {
  export const names: Record<string, string> = {
    [Attrs.Fire]: 'Fire',
    [Attrs.Water]: 'Water',
    [Attrs.Wood]: 'Wood',
    [Attrs.Light]: 'Light',
    [Attrs.Dark]: 'Dark',
    [Attrs.Heart]: 'Heart',
    [Attrs.Jammer]: 'Jammer',
    [Attrs.Poison]: 'Poison',
    [Attrs.MPoison]: 'Mortal Poison',
  };
}

export enum Types {
  EvoMaterial = 0,
  Balanced = 1,
  Physical = 2,
  Healer = 3,
  Dragon = 4,
  God = 5,
  Attacker = 6,
  Devil = 7,
  Machine = 8,
  AwakeningMaterial = 12,
  Special = 13,
  EnhancedMaterial = 14,
  Vendor = 15
}

export namespace Types {
  export const names: Record<string, string> = {
    [Types.EvoMaterial]: 'Evolution Material',
    [Types.Balanced]: 'Balanced',
    [Types.Physical]: 'Physical',
    [Types.Healer]: 'Healer',
    [Types.Dragon]: 'Dragon',
    [Types.God]: 'God',
    [Types.Attacker]: 'Attacker',
    [Types.Devil]: 'Devil',
    [Types.Machine]: 'Machine',
    [Types.AwakeningMaterial]: 'Awaken Material',
    [Types.Special]: 'Special',
    [Types.EnhancedMaterial]: 'Enhanced Material',
    [Types.Vendor]: 'Vendor'
  };
}

export enum OrbStatus {
  Enhanced = 6
}

export namespace OrbStatus {
  export const names = {
    [OrbStatus.Enhanced]: 'Enhanced'
  };
}

export enum Stats {
  ATT = 1,
  RCV = 2,
  MaxHP = 3,
  HP = 4,
  TeamRCV = 5,
}

export namespace Stats {
  export const names = {
    [Stats.ATT]: 'ATT',
    [Stats.RCV]: 'RCV',
    [Stats.MaxHP]: 'Maximum HP',
    [Stats.HP]: 'HP',
    [Stats.TeamRCV]: 'Team RCV',
  };
}

