
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