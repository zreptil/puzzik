import {Injectable} from '@angular/core';
import {RulesetBaseService} from './ruleset-base.service';
import {ConfigService} from './config.service';
import {MainFormService} from './main-form.service';
import {FieldDefService} from './field-def.service';
import {eAnimBack, eFieldType} from '../_model/field-def';
import {Area} from '../_model/area';

@Injectable({
  providedIn: 'root'
})
export class RulesetStr8tsService extends RulesetBaseService {

  constructor(cfg: ConfigService,
              _main: MainFormService,
              fds: FieldDefService) {
    super(cfg, _main, fds);
  }

  getVariations(): number[] {
    return [9, 6];
  }

  validateFields(setValue: boolean): boolean {
    let ret = false;
    let nums: { [key: number]: any } = {};

    for (const fld of this._main.paintDef.fields) {
      fld.isValid = true;
      let count = 0;
      let val = 0;

      for (const candidate of fld.candidates) {
        if (!candidate.hidden) {
          count++;
          val = candidate.value;
        }
      }

      if (count === 1 && setValue && fld.value !== val) {
        fld.value = val;
        ret = true;
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
      let max = 0;
      for (const fld of area.fields) {
        if (fld.value > max) {
          max = fld.value;
        }
      }

      for (const fld of area.fields) {
        if (fld.value > 0 && Math.abs(fld.value - max) >= area.fields.length) {
          for (const fld1 of area.fields) {
            fld1.isValid = false;
          }
          break;
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

    let idx = 0;
    // collect row areas
    for (let y = 0; y < this._main.paintDef.boardRows; y++) {
      for (let x = 0; x < this._main.paintDef.boardCols; x++) {
        if (idx === this._main.paintDef.areas.length - 1) {
          if (this._main.paintDef.field(x, y).type === eFieldType.User || this._main.paintDef.field(x, y).type === eFieldType.Preset) {
            this._main.paintDef.areas[idx].fields.push(this._main.paintDef.field(x, y));
          } else {
            idx++;
          }
        } else if (this._main.paintDef.field(x, y).type === eFieldType.User || this._main.paintDef.field(x, y).type === eFieldType.Preset) {
          const area = new Area(eAnimBack.MarkRow);
          area.fields.push(this._main.paintDef.field(x, y));
          this._main.paintDef.areas.push(area);
          idx = this._main.paintDef.areas.length - 1;
        }
      }
      if (idx === this._main.paintDef.areas.length - 1) {
        idx++;
      }
    }

    // collect column areas
    for (let x = 0; x < this._main.paintDef.boardCols; x++) {
      for (let y = 0; y < this._main.paintDef.boardRows; y++) {
        if (idx === this._main.paintDef.areas.length - 1) {
          if (this._main.paintDef.field(x, y).type === eFieldType.User || this._main.paintDef.field(x, y).type === eFieldType.Preset) {
            this._main.paintDef.areas[idx].fields.push(this._main.paintDef.field(x, y));
          } else {
            idx++;
          }
        } else if (this._main.paintDef.field(x, y).type === eFieldType.User || this._main.paintDef.field(x, y).type === eFieldType.Preset) {
          const area = new Area(eAnimBack.MarkColumn);
          area.fields.push(this._main.paintDef.field(x, y));
          this._main.paintDef.areas.push(area);
          idx = this._main.paintDef.areas.length - 1;
        }
      }
      if (idx === this._main.paintDef.areas.length - 1) {
        idx++;
      }
    }
  }
}
