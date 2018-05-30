export interface Skill {
  id: number;
  name: string;
  description: string;
  type: number;
  maxLevel: number;
  initialCooldown: number;
  params: number[];
}