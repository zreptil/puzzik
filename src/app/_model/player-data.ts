import {Utils} from '@/classes/utils';

export class PlayerData {
  constructor(public nr: number, private _name: string,
              private _colorBack: string,
              private _colorFore: string) {
  }

  static get defStyle(): any {
    return {
      color: 'white',
      backgroundColor: 'black',
      fontWeight: 'bold',
      fontStyle: 'normal'
    };
  }

  get name(): string {
    if (Utils.isEmpty(this._name)) {
      return `Spieler ${this.nr}`;
    }
    return this._name;
  }

  get style(): any {
    return {
      backgroundColor: this._colorBack,
      color: this._colorFore
    };
  }

  get currStyle(): any {
    return {
      backgroundColor: this._colorFore,
      color: this._colorBack
    };
  }
}
