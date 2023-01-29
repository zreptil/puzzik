import {Utils} from '@/classes/utils';

export class PlayerData {
  constructor(public nr: number, private _name?: string) {

  }

  get name(): string {
    if (Utils.isEmpty(this._name)) {
      return `Spieler ${this.nr}`;
    }
    return this._name;
  }
}
