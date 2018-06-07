export type DungeonData = Enemy[][];

export interface Enemy {
  type: number;
  id: number;
  level: number;
  dropId: number;
  dropLevel: number;
  plus: number;
}

export namespace DungeonData {
  export function parse(data: string) {
    if (!data.startsWith('waves='))
      throw new Error('invalid wave format');
    data = data.slice(6);

    let ptr = 0;
    let nextToken: string | null = null;
    function advance() {
      if ('[,:]'.includes(data[ptr]))
        return data[ptr++];
      else if (data[ptr] === '"') {
        const endIndex = data.indexOf('"', ptr + 1);
        const token = data.slice(ptr + 1, endIndex);
        ptr = endIndex + 1;
        return token;
      } else {
        let token = '';
        while (!'[,:]'.includes(data[ptr]))
          token += data[ptr++];
        return token;
      }
    }
    function next() {
      if (nextToken !== null) {
        const token = nextToken;
        nextToken = null;
        return token;
      } else return advance();
    }
    function peek() {
      if (nextToken !== null) return nextToken;
      else {
        nextToken = advance();
        return nextToken;
      }
    }
    function expect(token: string) {
      const read = next();
      if (read !== token) throw new Error(`expecting '${token}' at ${ptr}, got '${read}' instead`);
    }

    const waves = [];
    while (waves.length === 0 ? (peek() === '[') : (peek() === ',')) {
      next();
      expect('[');
      expect('w');
      const floor: Enemy[] = [];
      waves.push(floor);
      while (floor.length === 0 ? (peek() === ':') : (peek() === ',')) {
        next();
        expect('[');
        const enemy: Partial<Enemy> = {};
        enemy.type = Number(next()); expect(',');
        enemy.id = Number(next()); expect(',');
        enemy.level = Number(next()); expect(',');
        enemy.dropId = Number(next()); expect(',');
        enemy.dropLevel = Number(next()); expect(',');
        enemy.plus = Number(next());
        floor.push(enemy as Enemy);
        expect(']');
      }
      expect(']');
    }
    expect(']');

    return waves;
  }
}