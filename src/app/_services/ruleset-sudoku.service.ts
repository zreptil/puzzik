import {Injectable} from '@angular/core';
import {RulesetBaseService} from './ruleset-base.service';
import {Area} from '@/_model/area';
import {eAnimBack} from '@/_model/field-def';
import {FieldDefService} from './field-def.service';
import {MainFormService} from './main-form.service';
import {ConfigService, eGameMode} from './config.service';

// noinspection JSSuspiciousNameCombination
@Injectable({
  providedIn: 'root'
})
export class RulesetSudokuService extends RulesetBaseService {

  constructor(cfg: ConfigService,
              _main: MainFormService,
              fds: FieldDefService) {
    super(cfg, _main, fds);
  }

  /**
   * Ermittelt die möglichen Variationen.
   */
  public getVariations(): number[] {
    return [9];
  }

  /**
   * Überprüft die Felder auf Korrektheit.
   * @param setValue Wenn true, dann wird ein Kandidat als Feldwert gesetzt,
   *                 wenn es der einzige ist.
   */
  validateFields(setValue: boolean): boolean {
    let ret = false;
    let nums: { [key: number]: any } = {};
    for (const fld of this._main.paintDef.fields) {
      fld.isValid = true;
      let count = 0;
      let val = 0;

      if (fld.value <= 0 && this.cfg.gameMode === eGameMode.Solver) {
        for (const candidate of fld.candidates) {
          if (!candidate.hidden) {
            count++;
            val = candidate.value;
          }
        }

        if (count == 1 && setValue && fld.value !== val) {
          fld.value = val;
          ret = true;
        }
      }
      if (fld.value <= 0) {
        continue;
      }

      nums = {};
      for (let i = 0; i < this.cfg.numberCount; i++) {
        if (i != fld.x && this._main.paintDef.field(i, fld.y).value > 0) {
          nums[this._main.paintDef.field(i, fld.y).value] = true;
        }
      }
      if (nums[fld.value] != null) {
        fld.isValid = false;
      }

      nums = {};
      for (let i = 0; i < this.cfg.numberCount; i++) {
        if (i != fld.y && this._main.paintDef.field(fld.x, i).value > 0) {
          nums[this._main.paintDef.field(fld.x, i).value] = true;
        }
      }

      if (nums[fld.value] != null) {
        fld.isValid = false;
      }
    }

    for (const area of this._main.paintDef.areas) {
      nums = {};
      for (const fld of area.fields) {
        if (nums[fld.value] != null) {
          fld.isValid = false;
          nums[fld.value].isValid = false;
        } else {
          nums[fld.value] = fld;
        }
      }
    }
    return ret;
  }

  /**
   * Erstellt die benötigten Bereiche
   */
  createAreas(): void {
    this._main.paintDef.areas = [];

    let areaWid, areaHig;

    switch (this.cfg.numberCount) {
      case 6:
        areaWid = 3;
        areaHig = 2;
        break;

      default:
      case 9:
        areaWid = 3;
        areaHig = 3;
        break;
    }

    for (let y = 0; y < this.cfg.numberCount; y++) {
      const row = new Area(eAnimBack.MarkRow);
      const col = new Area(eAnimBack.MarkColumn);
      for (let x = 0; x < this.cfg.numberCount; x++) {
        row.fields.push(this._main.paintDef.field(x, y));
        this._main.paintDef.field(x, y).areas.push(row);
        col.fields.push(this._main.paintDef.field(y, x));
        this._main.paintDef.field(y, x).areas.push(col);
      }
      this._main.paintDef.areas.push(row);
      this._main.paintDef.areas.push(col);
    }

    for (let ya = 0; ya < this.cfg.numberCount / areaHig; ya++) {
      for (let xa = 0; xa < this.cfg.numberCount / areaWid; xa++) {
        const area = new Area(eAnimBack.MarkArea);
        for (let y = 0; y < areaHig; y++) {
          for (let x = 0; x < areaWid; x++) {
            area.fields.push(this._main.paintDef.field(xa * areaWid + x, ya * areaHig + y));
            this._main.paintDef.field(xa * areaWid + x, ya * areaHig + y).areas.push(area);
          }
        }
        this._main.paintDef.areas.push(area);
      }
    }
  }
}
