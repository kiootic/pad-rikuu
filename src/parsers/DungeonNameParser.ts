export function parse(name: string) {
  let badge = '';
  let bg = '';

  const bgMatch = /^\$(.{6})\$(.*)$/.exec(name);
  if (bgMatch) {
    bg = bgMatch[1];
    name = bgMatch[2];
  }

  const typeMatch = /^#(.)#(.*)$/.exec(name);
  if (typeMatch) {
    if (typeMatch[1] === 'C')
      badge = 'collab';
    else if (typeMatch[1] === 'G')
      badge = 'guerilla';
    name = typeMatch[2];
  }

  return { name, badge, bg };
}