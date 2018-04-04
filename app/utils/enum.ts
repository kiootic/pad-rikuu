import { range } from 'lodash';

export function parseFlags<T extends number>(flags: number): T[] {
  return range(0, 32).filter(i => flags & (1 << i)) as T[];
}