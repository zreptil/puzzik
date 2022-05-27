import {Injectable} from '@angular/core';
import {SolverBaseService} from './solver-base.service';
import {ConfigService} from './config.service';
import {MainFormService} from './main-form.service';
import {RulesetSudokuService} from './ruleset-sudoku.service';
import {Area} from '../_model/area';
import {CandidateBox} from '../_model/candidate-box';
import {eAnimBack, eFieldType, FieldDef} from '../_model/field-def';
import {CandidateFields} from '../_model/candidate-fields';

export type CandidateBoxes = { [key: string]: CandidateBox };
export type CandidateFieldCounts = { [key: number]: CandidateFields[] };

@Injectable({
  providedIn: 'root'
})
export abstract class SolverSudokuBaseService extends SolverBaseService {

  constructor(cfg: ConfigService,
              main: MainFormService,
              ruleset: RulesetSudokuService) {
    super(cfg, main, ruleset);
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
      if (this._paintDef.field(x, fld.y).type === eFieldType.User) {
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

  protected getCandidateCount(area: Area): CandidateFieldCounts {
    const ret: CandidateFieldCounts = [];
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
   * Eliminiert aus der Liste der moeglichen Eintraege
   * einer Zeile, Spalte und eines Bereichs diejenigen,
   * die eine bestimmte Anzahl Kandidaten in genau dieser Anzahl
   * an Feldern hat. In den Feldern dürfen ausser den Kandidaten
   * keine anderen Zahlen vorkommen.
   * Beispiel:
   * In einer Reihe, in der zwei Felder mit genau den
   * Eintraegen 3 und 7 stehen, werden diese beiden Zahlen
   * aus allen anderen Feldern der Reihe entfernt.
   * @protected
   */
  protected solveNaked(): void {
    for (let i = 2; i < 7; i++) {
      for (const area of this._paintDef.areas) {
        const boxes = this.getAreaCandidates(area);
        this.findNakedMulti(area, boxes, new CandidateBox(), 0, 0, i);
        if (this.hasAnimation) {
          return;
        }
      }
    }
  }

  private checkNakedMulti(area: Area, boxes: CandidateBoxes, ret: CandidateBox): void {
    let keep = false;
    for (const fld of ret.fields) {
      this.markCandidates(fld, eAnimBack.MarkField, ret.candidates);
    }
    for (const fld of area.fields) {
      if (ret.fields.find(f => f.equals(fld)) == null) {
        this.markField(area.backType, fld);
      }
    }

    Object.keys(boxes).forEach(key => {
      const box = boxes[key];
      for (const fld of box.fields) {
        if (ret.fields.find(f => f.equals(fld)) == null) {
          for (const candidate of ret.candidates) {
            if (!fld.getCandidate(candidate).hidden) {
              keep = true;
              this.delCandidate(fld, area.backType, candidate);
            }
          }
        }
      }
    });

    if (!keep) {
      this.clear();
    } else {
      this.setSolution(ret.fields.length, $localize`Die ${ret.fields.length} Kandidaten ${this.getCandidateString(ret.candidates)} finden sich gemeinsam als einzige Zahlen in den {0} markierten Feldern des angegebenen Bereichs. Damit können sie als mögliche Kandidaten aus den restlichen Feldern des Bereichs entfernt werden.`);
    }
  }

  private findNakedMulti(area: Area, boxes: CandidateBoxes, ret: CandidateBox, id: number, count: number, check: number): void {
    if (ret.fields.length === check && ret.fields.length === ret.candidates.length) {
      this.checkNakedMulti(area, boxes, ret);
      return;
    }

    let i = 0;
    Object.keys(boxes).forEach(key => {
      if (i >= id) {
        const box = boxes[key];
        const temp = ret.clone;
        temp.merge(box);
        this.findNakedMulti(area, boxes, temp, count + 1, i + 1, check);
        if (this.hasAnimation) {
          return;
        }
      }
      i++;
    });
  }

  /**
   * Gibt eine Liste aller Felder eines Bereichs mit den
   * Informationen über die Kandidaten darin zurück.
   * @param area zu überprüfender Bereich
   */
  private getAreaCandidates(area: Area): CandidateBoxes {
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
