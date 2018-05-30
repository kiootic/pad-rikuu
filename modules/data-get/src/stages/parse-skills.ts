import { formatJson, readFile, writeTo } from '../common';

function parseSkill(i: number, data: any[]) {
  return {
    id: i,
    name: data[0],
    description: data[1],
    type: data[2],
    maxLevel: data[3],
    initialCooldown: data[4],
    unk: data[5],
    params: data.slice(6)
  };
}

export async function parseSkills(basePath: string, versions: { skills: number }) {
  const data: { skill: any[], v: number } =
    JSON.parse(
      await readFile(basePath, 'skills', `${versions.skills}.json`)
        .then(buf => buf.toString('utf8'))
    );
  console.log(`parsing ${data.skill.length} skills (version ${data.v})...`);

  const skills = data.skill.map((skill, i) => parseSkill(i, skill));
  writeTo(formatJson(skills), basePath, 'skills.json');
  return true;
}
