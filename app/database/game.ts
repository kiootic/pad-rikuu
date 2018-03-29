import { observable, action } from 'mobx';

export class GameDB {
  @observable
  public isLoaded = false;

  @observable.shallow
  public cards: any[] | null = null;

  @observable
  public skills: any[] | null = null;

  @action
  private onLoaded([cards, skills]: any[]) {
    this.cards = cards;
    this.skills = skills;
    this.isLoaded = true;
  }

  private isLoading = false;
  public async load() {
    if (this.isLoaded || this.isLoading) return;
    this.isLoading = true;
    try {
      console.log('load');
      const data = await Promise.all([
        fetch('/static/data/game/cards.json').then(resp => resp.json()),
        fetch('/static/data/game/skills.json').then(resp => resp.json())
      ]);
      this.onLoaded(data);
    } finally {
      this.isLoading = false;
    }
  }
}