import React from 'react';
import { observer } from 'mobx-react';
import { repeat, range } from 'lodash';
import Link from 'next/link';

import { Store } from 'app/store';
import { Asset } from 'app/components/asset';
import { CardIcon } from 'app/components/cardIcon';
import css from 'styles/components/cardInfo.scss';
import { observable, computed, action } from 'mobx';
import { computeValue, Curve } from 'app/utils/curve';
import { SkillParser } from 'app/parser/skill';
import { renderSkills } from "app/renderer/skill";
import { CardImage } from 'app/components/cardImage';

export interface CardInfoProps {
  id: number;
  className?: string;
}

@observer
export class CardInfo extends React.Component<CardInfoProps> {
  private readonly store = Store.instance;

  @observable
  private selectedLevel: number = 0;
  @action
  private updateSelectedLevel(lv: string) {
    if (Number(lv))
      this.selectedLevel = Number(lv);
  }

  private curve(curve: Curve) {
    if (!this.card) return 0;
    let value = computeValue(this.selectedLevel || this.card.maxLevel, this.card.maxLevel, curve);
    if (this.selectedLevel > this.card.maxLevel) {
      const exceed = this.selectedLevel - this.card.maxLevel;
      value += ((curve.max || curve.min * 22) * this.card.limitBreakIncr / 100) * (exceed / 11);
    }
    return Math.round(value);
  }
  private expCurve(curve: Curve) {
    if (!this.card) return 0;
    const level = this.selectedLevel;
    return Math.round(
      computeValue(level || this.card.maxLevel, this.card.maxLevel, curve) +
      Math.max(0, level - this.card.maxLevel - 1) * 5000000
    );
  }


  @computed get maxLevel() { return this.card.maxLevel + (this.card.limitBreakIncr > 0 ? 11 : 0); }
  @computed get hp() { return this.curve(this.card.hp); }
  @computed get att() { return this.curve(this.card.att); }
  @computed get rcv() { return this.curve(this.card.rcv); }
  @computed get exp() { return this.expCurve(this.card.exp); }
  @computed get coin() { return this.curve({ min: this.card.sellPrice / 10 }); }
  @computed get feed() { return this.curve({ min: this.card.feedExp / 4 }); }

  @computed
  get id() { return this.props.id || 0; }

  @computed
  get card() { return this.store.gameDB.cards.find(card => card.id === this.id); }

  @action
  public componentWillReceiveProps(props: CardInfoProps) {
    this.selectedLevel = 0;
  }

  constructor(props: CardInfoProps) {
    super(props);
  }

  render() {
    if (!this.props.id) return null;

    const entry = this.store.imageDB.resolve('mons', this.id);
    const activeSkill = this.store.gameDB.skills[this.card.activeSkillId];
    const leaderSkill = this.store.gameDB.skills[this.card.leaderSkillId];

    return <main className={[css.main, this.props.className].join(' ')}>
      <section className={css.picture}>
        <CardImage id={this.id} />
      </section>
      <section className={css.summary}>
        <CardIcon id={this.id} link={false} />
        <p className={css.basic}>
          No. {this.id} <br />
          <strong className={css.title}>{this.card.name}</strong> <br />
          {repeat('\u2605', this.card.rarity)}
        </p>
        <div className={css.extended}>
          <table>
            <tbody>
              <tr><td colSpan={2}>
                {
                  (this.card.attrs as number[])
                    .filter(attr => attr !== -1)
                    .map((attr, i) => <Asset className={css.attr} assetKey={`attr-${attr}`} key={i} />)
                }
                <span className={css.spacer} />
                {
                  (this.card.types as number[])
                    .filter(type => type !== -1)
                    .map((type, i) => <Asset className={css.type} assetKey={`type-${type}`} key={i} />)
                }
              </td></tr>
              <tr>
                <td>max level: {this.maxLevel}</td>
                <td>max exp: {this.card.exp.max}</td>
              </tr>
              <tr>
                <td>cost: {this.card.cost}</td>
                <td>assist: {this.card.canAssist ? '\u2713' : '\u2717'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className={css.stats}>
        <table>
          <tbody>
            <tr>
              <th>LV</th>
              <th>HP</th>
              <th>ATT</th>
              <th>RCV</th>
            </tr>
            <tr>
              <td>
                <select value={this.selectedLevel || this.card.maxLevel}
                  onChange={e => this.updateSelectedLevel(e.target.value)}>{
                    range(1, this.maxLevel + 1)
                      .map(lv => <option key={lv} value={lv}>{lv === this.card.maxLevel ? 'MAX' : lv} </option>)
                  }
                </select>
              </td>
              <td>{this.hp}</td>
              <td>{this.att}</td>
              <td>{this.rcv}</td>
            </tr>
            <tr>
              <th>EXP</th>
              <th>FEED EXP</th>
              <th>COIN</th>
              <th>MP</th>
            </tr>
            <tr>
              <td>{this.exp}</td>
              <td>{this.feed}</td>
              <td>{this.coin}</td>
              <td>{this.card.sellMP}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className={css.skills}>
        <p className={css.info}>
          <span className={css.label}>active skill:</span>
          {activeSkill.name}
          <span className={css.spacer} />
          <span className={css.item}>max level: {activeSkill.maxLevel}</span>
          <span className={css.item}>
            cool down: {activeSkill.initialCooldown} (min. {activeSkill.initialCooldown - activeSkill.maxLevel + 1})
            </span>
        </p>
        <p>{activeSkill.description}</p>
        {
          !!activeSkill.id && renderSkills(new SkillParser(this.store.gameDB.skills).parse(activeSkill.id))
        }
        <hr />
        <p className={css.info}>
          <span className={css.label}>leader skill:</span>
          {leaderSkill.name}
        </p>
        <p>{leaderSkill.description}</p>
        {
          !!leaderSkill.id && renderSkills(new SkillParser(this.store.gameDB.skills).parse(leaderSkill.id))
        }
      </section>
    </main>
  }
}