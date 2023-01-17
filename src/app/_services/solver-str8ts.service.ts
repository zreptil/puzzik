import {Injectable} from '@angular/core';
import {ConfigService} from './config.service';
import {MainFormService} from './main-form.service';
import {RulesetStr8tsService} from './ruleset-str8ts.service';
import {SolveFn} from './solver-base.service';
import {eFieldType, FieldDef} from '../_model/field-def';
import {Area} from '../_model/area';
import {SolverSudokuBaseService} from './solver-sudoku-base.service';
import {ButtonData} from '../modules/controls/button/button.component';

@Injectable({
  providedIn: 'root'
})
export class SolverStr8tsService extends SolverSudokuBaseService {

  constructor(cfg: ConfigService,
              _main: MainFormService,
              ruleset: RulesetStr8tsService) {
    super(cfg, _main, ruleset);
  }

  override get controls(): ButtonData[] {
    const ret = super.controls;
    ret.push(this.main.btnData('block', this, this.cfg.numberCount + 1));
    return ret;
  }

  solveStep(): void {
    const functionList: SolveFn[] =
      [
        this.solveNakedSingle,
        this.solveExisting,
        this.solvePossibleNums,
        this.solveCandidateRanges,
        this.solveNaked,
        this.solveStranded
      ];

    this.initAnimation();
    for (const fn of functionList) {
      fn.bind(this)();
      if (this.hasAnimation) {
        this.doAfter = this.solveExisting;
        return;
      }
    }
  }

  override solveExisting(): void {
    for (const fld of this._paintDef.fields) {
      if (fld.value > 0) {
        this.solveExistingCandidates(fld);
      }
    }
  }

  override solveExistingCandidates(fld: FieldDef): void {
    for (let y = 0; y < this._paintDef.boardRows; y++) {
      if (this._paintDef.field(fld.x, y).type === eFieldType.User) {
        this._paintDef.field(fld.x, y).getCandidate(fld.value).hidden = true;
      }
    }

    for (let x = 0; x < this._paintDef.boardCols; x++) {
      if (this._paintDef.field(x, fld.y).type === eFieldType.User) {
        this._paintDef.field(x, fld.y).getCandidate(fld.value).hidden = true;
      }
    }
  }

  /**
   * Überprüft die Felder in jedem Bereich und entfernt die
   * Kandidaten, die zu weit von vorhandenen Zahlen entfernt sind.   * @private
   */
  private solvePossibleNums(): void {
    for (const area of this._paintDef.areas) {
      const empty: FieldDef[] = [];
      const nums: FieldDef[] = [];

      for (const fld of area.fields) {
        if (fld.value > 0) {
          nums.push(fld);
        } else {
          empty.push(fld);
        }
      }

      for (const fld of empty) {
        for (const candidate of fld.candidates) {
          if (candidate.hidden) {
            continue;
          }

          let found = false;

          for (const num of nums) {
            if (Math.abs(num.value - candidate.value) <= empty.length) {
              found = true;
            }
            if (Math.abs(num.value - candidate.value) >= area.fields.length) {
              found = false;
              break;
            }
          }
          if (!found && nums.length > 0) {
            this.delCandidate(fld, area.backType, candidate.value);
          }
        }
      }

      if (this.hasAnimation) {
        this.markArea(area);
        this.setSolution(0, $localize`Die Differenz der markierten Kandidaten zu den bekannten Zahlen ist zu gross, um eine lückenlose Zahlenreihe zu bilden. Daher können sie entfernt werden.`);
        return;
      }
    }
  }

  /*
    * Überprüft die Felder in jedem Bereich und entfernt die
    * Kandidaten, die zu weit von anderen Kandidaten entfernt sind.
  */
  private solveCandidateRanges(): void {
    for (const area of this._paintDef.areas) {
      if (area.fields.length === 1) {
        continue;
      }

      const empty = area.fields.filter(i => (i.value <= 0));

      for (const fld of empty) {
        for (const candidate of fld.candidates) {
          if (candidate.hidden) {
            continue;
          }

          if (empty.find(i => (i != fld &&
              i.candidates.find(j => (!j.hidden && Math.abs(j.value - candidate.value) === 1)) != null
            )) == null
            &&
            area.fields.find(i => (i.value > 0 && Math.abs(i.value - candidate.value) === 1)) == null
          ) {
            this.delCandidate(fld, area.backType, candidate.value);
          }
        }
      }

      if (this.hasAnimation) {
        this.markArea(area);
        this.setSolution(0, $localize`Es gibt für die markierten Kandidaten keinen Wert in der Zeile, der eine lückenlose Reihe zulassen würde. Daher können sie entfernt werden.`);
        return;
      }
    }
  }

  /*
     * Überprüft alle Felder eines Bereiches darauf, ob sich mit
    * dem Wert oder den Kandidaten in Verbindung mit den anderen
    * Feldern eine lückenlose Zahlenreihe bilden lässt.
    *
    * @returns true, wenn es möglich ist
   */
  private checkStr8t(area: Area, fld: FieldDef, nums: number[], idx: number): boolean {
    if (idx >= area.fields.length) {
      nums.sort();
      let last = 0;
      for (const value of nums) {
        if (last > 0 && value != last + 1) {
          return false;
        }
        last = value;
      }
      return true;
    } else if (fld != area.fields[idx]) {
      if (area.fields[idx].value > 0) {
        nums.push(area.fields[idx].value);
        return this.checkStr8t(area, fld, nums, idx + 1);
      } else {
        for (const candidate of area.fields[idx].candidates) {
          if (!candidate.hidden) {
            nums.push(candidate.value);
            if (this.checkStr8t(area, fld, nums, idx + 1)) {
              return true;
            }
            nums.splice(nums.length - 1, 1);
          }
        }
        return true;
      }
    } else {
      return this.checkStr8t(area, fld, nums, idx + 1);
    }
  }

  /*
    * überprüft alle Kandidaten daraufhin, ob sie zusammen mit den
    * bekannten Zahlen und den Kandidaten der anderen Felder eine
    * lückenlose Reihe bilden können. Wenn das nicht der Fall ist,
    * wird der entsprechende Kandidat entfernt.
  */
  private solveStranded(): void {
    for (const area of this._paintDef.areas) {
      if (area.fields.length === 1) {
        continue;
      }

      const empty = area.fields.filter(i => (i.value <= 0));

      for (const fld of empty) {
        for (const candidate of fld.candidates) {
          if (candidate.hidden) {
            continue;
          }

          if (!this.checkStr8t(area, fld, [candidate.value], 0)) {
            this.delCandidate(fld, area.backType, candidate.value);
          }
        }
      }

      if (this.hasAnimation) {
        this.markArea(area);
        this.setSolution(1, $localize`Die markierten Kandidaten können mit den Kandidaten und Zahlen der restlichen Felder keine lückenlose Reihe bilden. Daher können sie entfernt werden.`);
        return;
      }
    }
  }
}
