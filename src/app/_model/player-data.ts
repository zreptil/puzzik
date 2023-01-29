import {Utils} from '../classes/utils';

export class PlayerData {
  constructor(public idx: number) {

  }

  _name: string = null;

  get name(): string {
    if (Utils.isEmpty(this._name)) {
      return `Spieler ${this.idx + 1}`;
    }
    return this._name;
  }
}
