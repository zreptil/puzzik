import {Injectable} from '@angular/core';
import {SolverBaseService} from './solver-base.service';
import {ConfigService} from './config.service';
import {MainFormService} from './main-form.service';
import {RulesetSudokuService} from './ruleset-sudoku.service';
import {Area} from '../_model/area';
import {CandidateBox} from '../_model/candidate-box';
import {eFieldType, FieldDef} from '../_model/field-def';
import {CandidateFields} from '../_model/candidate-fields';

@Injectable({
  providedIn: 'root'
})
export abstract class SolverSudokuBaseService extends SolverBaseService {

  constructor(cfg: ConfigService,
              _main: MainFormService,
              ruleset: RulesetSudokuService) {
    super(cfg, _main, ruleset);
  }

  /**
   * Entfernt die kleinen Zahlen für die Lösungssuche soweit es
   * die Information des angegebenen Feldes zulassen.
   * @param fld Zu überprüfendes Feld
   */
  public solveExistingCandidates(fld: FieldDef): void {
    for (let y = 0; y < this._paintDef.boardRows; y++) {
      if (this._paintDef.field(fld.x, y).type === eFieldType.User) {
        this._paintDef.field(fld.x, y).getCandidate(fld.value).hidden = true;
      }
    }

    for (let x = 0; x < this._paintDef.boardCols; x++) {
      if (this._paintDef.field(x, fld.y).type == eFieldType.User) {
        this._paintDef.field(x, fld.y).getCandidate(fld.value).hidden = true;
      }
    }
  }

  protected getCandidateString(candidates: number[]): string {
    let ret = '';
    candidates.sort();
    for (let i = 0; i < candidates.length; i++) {
      ret += candidates[i];
      if (i === candidates.length - 2) {
        ret += ' und ';
      } else if (i < candidates.length - 2) {
        ret += ', ';
      }
    }
    return ret;
  }

  protected getCandidateCount(area: Area): { [key: number]: CandidateFields[] } {
    const ret: { [key: number]: CandidateFields[] } = [];
    for (let i = 1; i <= this.cfg.numberCount; i++) {
      const fld = this.getCandidateFields(area, i);
      if (fld.fields.length > 1) {
        if (ret[fld.fields.length] == null) {
          ret[fld.fields.length] = [];
        }
        ret[fld.fields.length].push(fld);
      }
    }
    return ret;
  }

  /**
   * Gibt eine Liste aller Felder eines Bereichs mit den
   * Informationen über die Kandidaten darin zurück.
   * @param area zu überprüfender Bereich
   */
  private getAreaCandidates(area: Area): { [key: string]: CandidateBox } {
    const ret: any = [];
    for (const fld of area.fields) {
      if (fld.type === eFieldType.User && fld.value <= 0) {
        if (ret[fld.candidateString] == null) {
          ret[fld.candidateString] = new CandidateBox(fld);
        } else {
          ret[fld.candidateString].fields.push(fld);
        }
      }
    }
    return ret;
  }

  /**
   * Gibt eine Liste aller Felder eines Bereichs mit den
   * Informationen über die Kandidaten darin zurück.
   * @param area Zu überprüfender Bereich
   * @param candidate zu überprüfender Kandidat
   */
  private getCandidateFields(area: Area, candidate: number): CandidateFields {
    const fields: FieldDef[] = [];

    for (const fld of area.fields) {
      if (fld.type === eFieldType.User && fld.value <= 0 && !fld.getCandidate(candidate).hidden) {
        fields.push(fld);
      }
    }

    return new CandidateFields(candidate, fields);
  }
}
