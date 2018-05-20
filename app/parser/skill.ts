import { createParsers } from 'app/data/skills';
import { SkillParser as Parser, SkillKinds } from 'app/types/skills';

export class SkillParser implements Parser {
  private readonly parsers = createParsers(this);
  constructor(private readonly skills: any[]) { }

  public parse(id: number) {
    const skill = this.skills.find(s => s.id === id);
    const parser = this.parsers[skill.type];
    if (!parser) return [{
      kind: SkillKinds.Unknown,
      raw: skill
    }];
    return parser(skill.params);
  }
}