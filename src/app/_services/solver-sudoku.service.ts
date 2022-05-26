import {Injectable} from '@angular/core';
import {SolveFn} from './solver-base.service';
import {eAnimBack, eFieldType, FieldDef} from '../_model/field-def';
import {ConfigService} from './config.service';
import {MainFormService} from './main-form.service';
import {SolverSudokuBaseService} from './solver-sudoku-base.service';
import {RulesetSudokuService} from './ruleset-sudoku.service';
import {FieldLink} from '../_model/field-link';

@Injectable({
  providedIn: 'root'
})
export class SolverSudokuService extends SolverSudokuBaseService {

  constructor(cfg: ConfigService,
              _main: MainFormService,
              ruleset: RulesetSudokuService) {
    super(cfg, _main, ruleset);
  }

  /**
   * Entfernt die kleinen Zahlen für die Lösungssuche soweit es
   * die Information des angegebenen Feldes zulassen.
   */
  public override solveExistingCandidates(fld: FieldDef): void {
    for (const area of this._main.paintDef.areas) {
      let found: FieldDef | undefined;
      if (fld.type === eFieldType.Control) {
        found = area.fields.find(f => f.value == fld.value);
      } else {
        found = area.fields.find(f => f === fld);
      }

      if (found == null) {
        continue;
      }

      for (const fld1 of area.fields) {
        if (fld1 != fld) {
          fld1.getCandidate(fld.value).hidden = true;
        }
      }
    }
  }

  /**
   * Versucht auf dem aktuellen Spielfeld eine Lösung für eine
   * Zahl oder den Ausschluss von Zahlen zu finden.
   */
  solveStep(): void {
    const functionList: SolveFn[] =
      [
        this.solveExisting
        /*
                solveNakedSingle,
                solveSingles,
                solveNaked,
                solveHidden,
                solveLinked,
                solveCrossingAreas,
                solveXWing,
                solveYWing,
        //*/
      ];

    // InitAnimation();
    for (const fn of functionList) {
      fn();
      // if (hasAnimation) {
      //   DoAfter = SolveExisting;
      //   return;
      // }
    }

  }

  private findField(list: FieldLink[], candidate: number, fld: FieldDef): FieldLink | null {
    let ret: FieldLink | null = null;

    for (const check of list) {
      if (check.candidate === candidate) {
        ret = check.findField(fld);
        if (ret != null) {
          return ret;
        }
      }
    }

    return null;
  }

  /**
   * Eliminiert aus der Liste der Kandidaten einer Zeile, Spalte
   * und eines Bereichs diejenigen, die sich in einem Feld
   * befinden, in dem Kandidaten sind, die insgesamt nur n mal
   * vorkommen.
   */
  private solveHidden(): void {
    for (const area of this._paintDef.areas
      ) {
      // Dictionary<int, List<CandidateFields>> counts = this.getCandidateCount(area);
      // for (int i = 7; i > 2; i--)
      // {
      //   FindHiddenMulti(area, counts, new CandidateFields(), i, i, 0);
      //   if (HasAnimation)
      //     return;
      // }
    }
  }

  /**
   * Prüft einen Wert in einem Feld darauf, ob er in einem Bereich
   * als einziger vorkommt.
   * @param fld Zu überprüfendes Feld.
   * @param value Zu überprüfender Wert.
   */
  private checkSingle(fld: FieldDef, value: number): void {
    let found = false;
    for (const area of this._paintDef.areas) {
      if (fld.areas.find(a => a.equals(area)) == null) {
        continue;
      }

      found = false;

      for (let i = 0; i < area.fields.length && !found; i++) {
        const fld1 = area.fields[i];
        if (fld1.type === eFieldType.User && fld1.value <= 0 && (fld.x != fld1.x || fld.y != fld1.y)) {
          found = !fld1.getCandidate(value).hidden;
        }
      }

      if (!found) {
        for (const fld1 of area.fields) {
          if (fld1.x != fld.x || fld1.y != fld.y) {
            this.markField(area.backType, this._paintDef.field(fld1.x, fld1.y));
          }
        }
        this.setCandidate(fld, eAnimBack.MarkField, value);
        this.setSolution(0, $localize`Die Zahl ${value} kommt im markierten Bereich nur in einem Feld vor`);
      }
    }
  }

}
