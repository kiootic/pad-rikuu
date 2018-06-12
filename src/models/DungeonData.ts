export interface DungeonData {
  dungeon: number;
  floor: number;

  invades: DungeonInvade[];
  waves: DungeonWave[];
}

export interface DungeonInvade {
  floors: number[];
  enemy: DungeonEnemy;
}

export interface DungeonWave {
  type: 'template' | 'random';
  minEnemies: number;
  maxEnemies: number;
  enemies: DungeonEnemy[];
}

export interface DungeonEnemy {
  id: number;
  level: number;
  drops: Array<{
    id: number;
    level: number;
  }>;
  plus: number;
}
