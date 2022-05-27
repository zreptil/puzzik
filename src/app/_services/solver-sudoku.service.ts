import {Injectable} from '@angular/core';
import {SolveFn} from './solver-base.service';
import {eAnimBack, eAnimMark, eFieldType, FieldDef} from '../_model/field-def';
import {ConfigService} from './config.service';
import {MainFormService} from './main-form.service';
import {CandidateFieldCounts, SolverSudokuBaseService} from './solver-sudoku-base.service';
import {RulesetSudokuService} from './ruleset-sudoku.service';
import {FieldLink} from '../_model/field-link';
import {Area} from '../_model/area';
import {CandidateFields} from '../_model/candidate-fields';
import {LinkedCandidates} from '../_model/linked-candidates';

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
    for (const area of this.main.paintDef.areas) {
      let found: FieldDef | undefined;
      if (fld.type === eFieldType.Control) {
        found = area.fields.find(f => +f.value === +fld.value);
      } else {
        found = area.fields.find(f => f.equals(fld));
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
        this.solveExisting,
        this.solveNakedSingle,
        this.solveSingles,
        this.solveNaked,
        this.solveHidden,
        this.solveLinked,
        this.solveCrossingAreas,
        this.solveXWing,
        /*
                solveYWing,
        //*/
      ];

    this.initAnimation();
    for (const fn of functionList) {
      fn.bind(this)();
      if (this.hasAnimation) {
        // console.log(this.animations);
        this.doAfter = this.solveExisting;
        return;
      }
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
   * Sucht nach Zahlen, die als einzige in einem Bereich vorhanden sind.
   * @private
   */
  private solveSingles(): void {
    for (const fld of this._paintDef.fields) {
      if (fld.type === eFieldType.User && fld.value <= 0) {
        for (const candidate of fld.candidates) {
          if (!candidate.hidden) {
            this.checkSingle(fld, candidate.value);
            if (this.hasAnimation) {
              return;
            }
          }
        }
      }
    }
  }

  /**
   * Eliminiert aus der Liste der Kandidaten einer Zeile, Spalte
   * und eines Bereichs diejenigen, die sich in einem Feld
   * befinden, in dem Kandidaten sind, die insgesamt nur n mal
   * vorkommen.
   */
  private solveHidden(): void {
    for (const area of this._paintDef.areas) {
      const counts = this.getCandidateCount(area);
      for (let i = 7; i > 2; i--) {
        this.findHiddenMulti(area, counts, new CandidateFields(), i, i, 0);
        if (this.hasAnimation) {
          return;
        }
      }
    }
  }

  private findHiddenMulti(area: Area, counts: CandidateFieldCounts, ret: CandidateFields, count: number, max: number, level: number): void {
    if (count < 2) {
      if (ret.collected.length === max && ret.fields.length === max) {
        let keep = false;
        for (const fld of area.fields) {
          if (ret.fields.find(f => f.equals(fld)) != null) {
            this.markCandidates(fld, eAnimBack.MarkField, ret.collected);
            for (let i = 1; i <= this.cfg.numberCount; i++) {
              if (!fld.getCandidate(i).hidden && ret.collected.find(c => +c === +i) == null) {
                this.delCandidate(fld, eAnimBack.MarkField, i);
                keep = true;
              }
            }
          } else {
            this.markField(area.backType, fld);
          }
        }
        if (keep) {
          this.setSolution(max + 4, $localize`Die ${max} Kandidaten ${this.getCandidateString(ret.collected)} finden sich nur in den ${max} markierten Feldern. Deshalb können alle anderen Kandidaten aus diesen Feldern entfernt werden.`);
        } else {
          this.clear();
        }
      } else {
        ret.fields = [];
        ret.collected = [];
      }
      return;
    }

    if (counts[count] == null) {
      this.findHiddenMulti(area, counts, ret, count - 1, max, level + 1);
      return;
    }

    let lastI = -1;
    for (let i = 0; i < counts[count].length; i++) {
      const list = counts[count][i];
      if (ret.fields.length === 0) {
        ret.candidate = list.candidate;
        for (const fld of list.fields) {
          ret.fields.push(fld);
        }
        ret.collected.push(list.candidate);
        lastI = i;
      } else {
        const temp: FieldDef[] = [];
        for (const fld of list.fields) {
          if (ret.fields.find(f => f.equals(fld)) == null) {
            temp.push(fld);
          }
        }
        if (ret.fields.length + temp.length <= max) {
          ret.collected.push(list.candidate);
          for (const t of temp) {
            ret.fields.push(t);
          }
        } else {
          if (lastI >= 0) {
            ret.clear();
            i = lastI;
          }
        }
      }
      if (lastI >= 0) {
        this.findHiddenMulti(area, counts, ret, count - 1, max, level + 1);
      }
    }
    this.findHiddenMulti(area, counts, ret, count - 1, max, level + 1);
  }

  private solveLinked(): void {
    const ret: { [key: number]: LinkedCandidates[] } = [];
    const linkList: FieldLink[] = [];
    for (const area of this._paintDef.areas) {
      const counts = this.getCandidateCount(area);
      // Alle Kandidaten raussuchen, die genau zweimal in diesem Bereich vorkommen
      if (counts[2] != null) {
        for (const list of counts[2]) {
          const entry = new LinkedCandidates(area, list.candidate);
          for (const fld of list.fields) {
            for (const candidate of fld.candidates) {
              candidate.tag = 0;
            }
          }
          for (const fld of list.fields) {
            entry.fields.push(fld);
          }
          if (ret[list.candidate] == null) {
            ret[list.candidate] = [];
          }
          ret[list.candidate].push(entry);

          let link0 = this.findField(linkList, list.candidate, list.fields[0]);
          const link1 = this.findField(linkList, list.candidate, list.fields[1]);
          if (link0 == null && link1 == null) {
            link0 = new FieldLink(list.fields[0], list.candidate, null);
            link0.linked.push(new FieldLink(list.fields[1], list.candidate, link0));
            linkList.push(link0);
          } else if (link0 == null && link1 != null) {
            link1.linked.push(new FieldLink(list.fields[0], list.candidate, link1));
          } else if (link0 != null && link1 == null) {
            link0.linked.push(new FieldLink(list.fields[1], list.candidate, link0));
          } else if (link0 != null && link1 != null) {
            if (link0.findField(list.fields[1]) != null || link1.findField(list.fields[0]) != null) {
              continue;
            }
            if (link0.parent == null) {
              link1.linked.push(link0);
              linkList.splice(linkList.indexOf(link0), 1);
            } else if (link1.parent == null) {
              link0.linked.push(link1);
              linkList.splice(linkList.indexOf(link1), 1);
            }
          } else {
            console.error('Das hier sollte eigentlich nie aufgerufen werden!');
          }
        }
      }
    }

    Object.keys(ret).forEach(key => {
      const links = linkList.filter(l => l.candidate === +key);
      let keep = false;
      for (const link of links) {
        link.setTag(1);
        const tree: FieldLink[] = [];
        link.collectFields(tree);
        const count = this.count;
        const delTag = this.checkLinkTags(tree, 0, 0);
        if (delTag != 0) {
          keep = true;
          for (const temp of tree) {
            if (temp.field.getCandidate(+key).tag === delTag) {
              this.delCandidate(temp.field, eAnimBack.None, +key);
            }

            const tmp = ret[+key].filter(j => j.fields.find(f => f.equals(temp.field)) != null);

            if (tmp != null) {
              for (const c of tmp) {
                this.markLink(c);
              }
            }
          }
        }
      }

      if (keep) {
        this.setSolution(6, $localize`Der Kandidat ${key} ist in einer Folge von miteinander verbundenen Bereichen innerhalb dieser Bereiche jeweils zweimal vorhanden. Er kann aus den markierten Feldern entfernt werden, da diese auch in einem Bereich liegen, aber die gleiche Farbe haben.`);
        return;
      } else {
        this.clear();
      }
    });
  }

  // Stimmt noch nicht, es werden zu viele Tags als gleich erkannt.
  private checkLinkTags(list: FieldLink [], idx: number, ret: number): number {
    const fld = list[idx];
    for (let i = idx + 1; i < list.length; i++) {
      const check = list[i];
      for (const area of fld.field.areas) {
        if (check != fld && check.field.areas.find(a => a.equals(area)) != null && fld.field.getCandidate(fld.candidate).tag === check.field.getCandidate(check.candidate).tag) {
          ret = check.field.getCandidate(check.candidate).tag;
          this.delCandidate(fld.field, eAnimBack.MarkField, fld.candidate);
          this.delCandidate(check.field, eAnimBack.MarkField, check.candidate);
          this.markArea(area);
        }
      }
      ret = this.checkLinkTags(list, idx + 1, ret);
    }

    return ret;
  }

  private solveCrossingAreas(): void {
    for (const area of this._paintDef.areas) {
      const counts = this.getCandidateCount(area);

      Object.keys(counts).forEach(key => {
        const count = +key;
        for (const list of counts[count]) {
          const areaUsage: { [key: string]: { count: number, area: Area } } = {};
          for (const fld of list.fields) {
            for (const fldArea of fld.areas) {
              if (!area.equals(fldArea)) {
                if (areaUsage[fldArea.toString()] == null) {
                  areaUsage[fldArea.toString()] = {count: 0, area: fldArea};
                }
                areaUsage[fldArea.toString()].count++;
              }
            }
          }

          Object.keys(areaUsage).forEach(key => {
            const used = areaUsage[key].area;
            if (areaUsage[key].count === count) {
              let keep = false;
              for (const fld of used.fields) {
                if (fld.type === eFieldType.User && fld.value <= 0) {
                  if (!fld.getCandidate(list.candidate).hidden) {
                    if (fld.areas.find(a => a.equals(area)) == null) {
                      keep = true;
                      this.delCandidate(fld, used.backType, list.candidate);
                    } else {
                      this.markCandidate(fld, used.backType, list.candidate);
                    }
                  } else {
                    this.markField(used.backType, fld);
                  }
                }
              }
              if (keep && this.hasAnimation) {
                this.markArea(area);
                this.setSolution(2, $localize`Der Kandidat ${list.candidate} kommt of zwei sich überschneidenden Bereichen vor und of einem der Bereiche nur innerhalb der Überschneidung. Damit kann er aus dem anderen Bereich entfernt werden.`);
                return;
              } else {
                this.clear();
              }
            }
          });
        }
      });
    }
  }

  /**
   * XWing - wenn ein Kandidat in einer Zeile genau zweimal vorkommt
   * und es eine andere Zeile gibt, in der auch zweimal an genau den gleichen Spalten
   * vorkommt, kann er in den enstsprechenden Spalten nicht mehr woanders vorkommen.
   * Das selbe gilt umgekehrt auch für Spalten und Zeilen.
   * @private
   */
  private solveXWing(): void {
    for (const area of this._paintDef.areas) {
      const counts = this.getCandidateCount(area);
      // Alle Kandidaten raussuchen, die genau zweimal in diesem Bereich vorkommen
      if (counts[2] != null) {
        {
          for (const list of counts[2]) {
            const check = this._paintDef.areas.filter(a => a.backType === area.backType);
            if (check != null) {
              for (const a of check) {
                const cnts = this.getCandidateCount(a);
                if (cnts[2] != null) {
                  for (const cf of cnts[2]) {
                    if (cf.equals(list) || cf.candidate != list.candidate) {
                      continue;
                    }

                    let keep = false;
                    this.markArea(area);
                    this.markArea(a);
                    switch (area.backType) {
                      case eAnimBack.MarkRow:
                        if (cf.equalsColumn(list)) {
                          for (const fd of cf.fields) {
                            for (let y = 0; y < this._paintDef.boardRows; y++) {
                              const fld = this._paintDef.field(fd.x, y);
                              if (cf.fields.filter(f => f.y === y)?.length === 0 && list.fields.filter(f => f.y === y)?.length === 0) {
                                if (fld.value < 0 && !fld.getCandidate(list.candidate).hidden) {
                                  keep = true;
                                  this.delCandidate(fld, eAnimBack.MarkField, list.candidate);
                                } else {
                                  this.markCandidate(fld, eAnimBack.MarkField, list.candidate);
                                }
                              } else {
                                this.markCandidate(fld, eAnimBack.MarkField, list.candidate);
                              }
                            }
                          }
                        }
                        break;
                      case eAnimBack.MarkColumn:
                        if (cf.equalsRow(list)) {
                          for (const fd of cf.fields) {
                            for (let x = 0; x < this._paintDef.boardCols; x++) {
                              const fld = this._paintDef.field(x, fd.y);
                              if (cf.fields.filter(f => f.x === x)?.length === 0 && list.fields.filter(f => f.x === x)?.length === 0) {
                                if (fld.value < 0 && !fld.getCandidate(list.candidate).hidden) {
                                  keep = true;
                                  this.delCandidate(fld, eAnimBack.MarkField, list.candidate);
                                } else {
                                  this.markCandidate(fld, eAnimBack.MarkField, list.candidate);
                                }
                              } else {
                                this.markCandidate(fld, eAnimBack.MarkField, list.candidate);
                              }
                            }
                          }
                        }
                        break;
                    }
                    if (keep && this.hasAnimation) {
                      this.setSolution(7, $localize`Der Kandidat ${list.candidate} kommt in den markierten Bereichen genau zweimal an der gleichen Stelle vor. Damit kann er aus den gefärbten Feldern entfernt werden.`);
                      return;
                    }
                    this.clear();
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  /**
   * YWing -
   */
  private solveYWing(): void {
    for (const anker of this._paintDef.fields) {
      if (this.findYWingFirst(anker)) {
        return;
      }
    }
  }

  /// <summary>
  /// Sucht in den Bereichen vom Anker nach einem Feld, in dem genau zwei Kandidaten
  /// sind und wo einer der Kandidaten einem der Kandidaten des Ankers entspricht. Das
  /// wird nur ausgeführt, wenn der Anker genau zwei Kandidaten beinhaltet.
  /// </summary>
  /// <param name="anker">Zu überprüfendes Ankerfeld.</param>
  /// <returns>true, wenn ein Y-Wing erkannt und behandelt wurde, false wenn nicht.</returns>
  private findYWingFirst(anker: FieldDef): boolean {
    if (anker.getCandidates().length != 2) {
      return false;
    }

    const c1 = anker.getCandidates()[0].value;
    const c2 = anker.getCandidates()[1].value;
    for (const area of anker.areas) {
      for (const f of area.fields) {
        if (f.getCandidates().length != 2) {
          continue;
        }

        const ca = f.getCandidates()[0].value;
        const cb = f.getCandidates()[1].value;
        let done = false;

        if (+c1 === +ca && +c2 !== +cb) {
          done = this.findYWingSecond(anker, area, f, c1, c2, cb);
        } else if (+c1 === +cb && +c2 !== +ca) {
          done = this.findYWingSecond(anker, area, f, c1, c2, ca);
        } else if (+c2 === +ca && +c1 !== +cb) {
          done = this.findYWingSecond(anker, area, f, c2, c1, cb);
        } else if (+c2 === +cb && +c1 !== +ca) {
          done = this.findYWingSecond(anker, area, f, c2, c1, ca);
        }

        if (done) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Sucht in den Bereichen von Anker nach einem Feld, das
   * @param anker Ankerfeld.
   * @param f1Area Erstes Feld.
   * @param f1 Gemeinsamer Kandidat in anker und f1.
   * @param ca1 Kandidat nur in anker.
   * @param ca2 Kandidat nur in anker.
   * @param cf1 Kandidat nur in f1, muss auch in f2 sein.
   */
  private findYWingSecond(anker: FieldDef, f1Area: Area, f1: FieldDef, ca1: number, ca2: number, cf1: number): boolean {
    let ret = false;

    for (const area of anker.areas) {
      for (const
        f2 of area.fields
        ) {
        if (f2.getCandidates().length != 2) {
          continue;
        }
        if (!f2.getCandidate(ca2).hidden && !f2.getCandidate(cf1).hidden && !f2.canSee(f1)) {
          this.markArea(area);
          this.markArea(f1Area);
          this.markCandidate(anker, eAnimBack.MarkField, ca1);
          this.markCandidate(anker, eAnimBack.MarkField, ca2);
          this.markCandidate(f1, eAnimBack.MarkField, ca1);
          this.markCandidate(f2, eAnimBack.MarkField, ca2);
          this.markCandidate(f1, eAnimBack.MarkField, cf1, eAnimMark.Show);
          this.markCandidate(f2, eAnimBack.MarkField, cf1, eAnimMark.Show);
          let keep = false;
          for (const
            a of f1.areas
            ) {
            for (const
              fld of a.fields
              ) {
              if (fld.value <= 0 && fld != f2 && fld != f1 && f2.canSee(fld) && !fld.getCandidate(cf1).hidden) {
                keep = true;
                this.delCandidate(fld, eAnimBack.None, cf1);
              }
            }
          }

          if (keep) {
            this.setSolution(7, $localize`Die Kandidaten ${ca1} und ${ca2} kommen in einem Feld zusammen und in zwei anderen Feldern jeweils einzeln vor. Der Kandidat ${cf1}, der in den beiden anderen Feldern gemeinsam vorkommt, kann aus den sich überschneidenden Bereichen der beiden Felder entfernt werden.`);
            return true;
          } else {
            this.clear();
          }
        }
      }
    }

    return ret;
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
        return;
      }
    }
  }

}
