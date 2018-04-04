import { createParsers } from'app/data/skills';
import { SkillParser as Parser } from 'app/types/skills';

export class SkillParser implements Parser {
  private readonly parsers = createParsers(this);
  constructor(private readonly skills: any[]) { }

  public parse(id: number) {
    const skill = this.skills.find(s => s.id === id);
    return this.parsers[skill.type](skill.params);
  }
}