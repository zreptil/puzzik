import {FieldDef} from './field-def';
import {Area} from './area';
import {ButtonData} from '../modules/controls/button/button.component';
import {FieldDefService} from '../_services/field-def.service';

export class PaintDefinitions {
  public fields: FieldDef[] = [];
  public areas: Area[] = [];
  public currentCtrl?: ButtonData;

  constructor(public fds: FieldDefService) {
  }

  private _boardCols = 0;

  public get boardCols(): number {
    return this._boardCols > 0 ? this._boardCols : 8;
  }

  public set boardCols(value: number) {
    this._boardCols = value;
  }

  private _boardRows = 0;

  public get boardRows(): number {
    return this._boardRows > 0 ? this._boardRows : 8;
  }

  public set boardRows(value: number) {
    this._boardRows = value;
  }

  public setField(x: number, y: number, src: FieldDef): void {
    this.field(x, y).copyFrom(src);
  }

  public field(x: number, y: number): FieldDef {
    let ret = this.fields.find(f => +f.x === +x && +f.y === +y);
    if (ret == null) {
      ret = this.fds.create(`${x}|${y}`);
      this.fields.push(ret);
    }
    return ret;
  }
}

