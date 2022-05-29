import {Injectable} from '@angular/core';
import {eAnimBack, eAnimFore, eAnimMark, eFieldType, FieldDef} from '../_model/field-def';
import {Area} from '../_model/area';
import {RulesetBaseService} from './ruleset-base.service';
import {FieldDefService} from './field-def.service';
import {MainFormService} from './main-form.service';
import {ConfigService, eAppMode, eGameMode} from './config.service';
import {ButtonData} from '../modules/controls/button/button.component';
import {AnimDef} from '../_model/anim-def';
import {LinkedCandidates} from '../_model/linked-candidates';

export type SolveFn = () => void;

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

@Injectable({
  providedIn: 'root'
})
export abstract class SolverBaseService {

  public doAfter?: SolveFn;
  public animations: AnimDef[] = [];
  protected _paintDef: PaintDefinitions;
  protected _solver: SolverBaseService | null = null;
  private _factor = 1.0;
  private _xPos = 0;
  private _yPos = 0;
  private _active = false;
  private _preHint = '@308030ffffff@';
  private _colMarkArea = 0x80ff80ff; // Color.FromArgb(255, 100, 255, 100);
  private _colMarkCandidate = 0xffff8080; // Color.FromArgb(255, 100, 100, 255);
  private _colFontCandidate = 0xffffffff; // Color.FromArgb(255, 255, 255, 255);
  private _colFontCandidateDel = 0xffffffff; //Color.FromArgb(255, 255, 255, 255);

  /**
   * Initialisiert eine neue Instanz von SolverBase.
   * @param cfg Service für Konfigurationseinstellungen.
   * @param main Service für die Anzeige der Oberfläche
   * @param ruleset Regelsatz für das Spiel
   */
  protected constructor(public cfg: ConfigService,
                        public main: MainFormService,
                        public ruleset: RulesetBaseService) {
    this._paintDef = main.paintDef;
    this.clearAnimations();
  }

  private _speed = 0.1;

  public get speed(): number {
    return this._speed;
  }

  public set speed(value: number) {
    this._speed = value;
  }

  private _difficulty: Map<number, number> = new Map<number, number>();

  /**
   * Ermittelt oder setzt den Schwierigkeitsgrad.
   */
  public get difficulty(): number {
    let ret = 0;

    for (const key of this._difficulty.keys()) {
      ret += (this._difficulty.get(key) || 0) * (key + 1);
    }

    return ret;
  }

  public set difficulty(value: number) {
    this._difficulty.set(value, (this._difficulty.get(value) || 0) + 1);
  }

  private _hint: string | null = null;

  public get hint(): string {
    return this._hint || '';
  }

  public get hasAnimation(): boolean {
    return this.animations?.length > 0;
  }

  /**
   * Ermittelt ob ein Sover verfügbar ist oder nicht.
   */
  public get isAvailable(): boolean {
    return false;
  }

  public get hasCandidateTip(): boolean {
    for (const anim of this.animations || []) {
      if (anim.foreType === eAnimFore.SetCandidate) {
        return true;
      }
    }
    return false;
  }

  public get isActive(): boolean {
    return this._active;
  }

  public get count(): number {
    return this.animations?.length || 0;
  }

  public get diffString(): string {
    let ret = '';

    for (const key of this._difficulty.keys()) {
      const val = this._difficulty.get(key) || 0;
      ret = `${val} x Schwierigkeitsgrad ${key} => ${val * key}`;
    }
    //    ret += String.Format("{1} x Schwierigkeitsgrad {0} => {2}\n", val, _difficulty[val], _difficulty[val] * (val + 1));

    ret += `\nSchwierigkeitsgrad: ${this.difficulty}`;

    return ret;
  }

  /**
   * Löscht die Animationsliste.
   */
  clearAnimations(idx?: number): void {
    if (idx != null) {
      this.animations.splice(idx, this.animations.length - idx);
    } else {
      this.animations = [];
    }
  }

  /**
   * Versucht auf dem aktuellen Spielfeld eine Lösung für eine
   * Zahl oder den Ausschluss von Zahlen zu finden.
   */
  public abstract solveStep(): void;

  /**
   * Entfernt die kleinen Zahlen für die Lösungssuche soweit es
   * die Information des angegebenen Feldes zulassen.
   */
  public abstract solveExistingCandidates(fld: FieldDef): void;

  /**
   * Setzt den Schwierigkeitsgrad der ermittelten Lösung und den
   * Hinweis, der dem Benutzer angezeigt wird.
   */
  public setSolution(difficulty: number, hint: string): void {
    this.difficulty = difficulty;
    if (this.cfg.devSupport) {
      this._hint = `${hint} (Schwierigkeit: ${difficulty})`;
    } else {
      this._hint = `${hint}`;
    }
    console.log('----------------------------', hint);
    for (const a of this.animations) {
      console.log(a.jsonize());
    }
    console.error('----------------------------', this.animations.length);
  }

  /**
   * Setzt den Schwierigkeitsgrad zurück.
   */
  public resetDifficulty(): void {
    this._difficulty = new Map<number, number>();
  }

  /**
   * Initialisiert die Animation.
   */
  public initAnimation(): void {
    this._factor = 1.0;
    this.clearAnimations();
    this._hint = '';
    this.main.memorizeBoard();
  }

  /**
   * Markiert jedes Feld eines Bereichs.
   * @param area Der zu markierende Bereich.
   */
  public markArea(area: Area): void {
    for (const fld of area.fields) {
      const anim = this.animations.find(i => i.field != null && i.field.equals(fld) && +i.backType === +area.backType);
      if (anim != null) {
        continue;
      }
      this.addAnimation(this.getAnimation(area.backType, fld));
    }
  }

  /**
   * Markiert ein Feld.
   * @param backType Art der Hintergrundanimation für das Feld.
   * @param fld Das zu markierende Feld.
   * @param forceNew wenn true, wird auf alle Fälle eine neue Animation hinzugefügt
   */
  public markField(backType: eAnimBack, fld: FieldDef, forceNew = false): void {
    if (forceNew) {
      this.addAnimation(new AnimDef(backType, eAnimFore.None, fld));
    } else {
      this.addAnimation(this.getAnimation(backType, fld));
    }
  }

  /**
   * Markiert einen Link.
   * @param link Der zu markierende Link.
   */
  public markLink(link: LinkedCandidates): void {
    const anim = new AnimDef(eAnimBack.None, eAnimFore.MarkLink, null);
    anim.link = link;
    this.addAnimation(anim);
  }

  /**
   * Löscht einen Kandidaten.
   * @param fld Feld des Kandidaten.
   * @param backType Hintergrundtyp für das Feld.
   * @param candidate Zu löschender Kandidat.
   */
  public delCandidate(fld: FieldDef, backType: eAnimBack, candidate: number): void {
    let anim = this.animations.find(a => a.field != null && +a.field.x === +fld.x && +a.field.y === +fld.y && +a.foreType === +eAnimFore.DelCandidate);
    if (anim == null) {
      anim = new AnimDef(backType, eAnimFore.DelCandidate, fld);
    }
    if (anim.candidates.find(f => +f === +candidate) != null) {
      return;
    }
    anim.candidates.push(candidate);
    this.addAnimation(anim);
  }

  /**
   * Setzt einen Kandidaten.
   * @param fld Feld des Kandidaten.
   * @param backType Hintergrundtyp für das Feld.
   * @param candidate Zu setzender Kandidat.
   */
  public setCandidate(fld: FieldDef, backType: eAnimBack, candidate: number): void {
    let anim = new AnimDef(backType, eAnimFore.SetCandidate, fld);
    anim.candidates.push(candidate);
    this.addAnimation(anim);
  }

  /**
   * Markiert einen Kandidaten.
   * @param fld Feld des Kandidaten.
   * @param backType Hintergrundtyp für das Feld.
   * @param candidate Zu markierender Kandidat.
   * @param markType Art der Markierung.
   */
  public markCandidate(fld: FieldDef, backType: eAnimBack, candidate: number, markType = eAnimMark.Mark): void {
    let anim = this.animations.find(a => a.field != null && +a.field.x === +fld.x && +a.field.y === +fld.y && +a.foreType === +eAnimFore.MarkCandidate);
    if (anim == null) {
      anim = new AnimDef(backType, eAnimFore.MarkCandidate, fld);
    }

    if (anim.candidates.find(c => +c === +candidate) != null) {
      return;
    }

    anim.candidates.push(+candidate);
    anim.candidateMarks[+candidate] = markType;
    this.addAnimation(anim);
  }

  /**
   * Markiert mehrere Kandidaten in einem Feld.
   * @param fld Feld der Kandidaten.
   * @param backType Hintergrundtyp für das Feld.
   * @param candidates Liste der Kandidaten.
   */
  public markCandidates(fld: FieldDef, backType: eAnimBack, candidates: number[]): void {
    const anim = new AnimDef(backType, eAnimFore.MarkCandidate, fld);
    anim.candidates = candidates;
    this.addAnimation(anim);
  }

  public stopAnimation(): void {
    if (this.cfg.gameMode != eGameMode.Solver) {
      return;
    }

    this.executeAnimationActions();

    if (this.animations.length === 0) {
      this.main.hint = $localize`${this._preHint}Ich konnte aufgrund der mir bekannten Algorithmen keine weitere logische Schlussfolgerung ziehen.`;
    } else if (this.cfg.appMode == eAppMode.AnimateAll) {
      this.main.updateHistory();
      // this._main.recreateForm();
      this.clearAnimations();
      this._solver?.solveStep();
      if (this.animations.length > 0) {
        // this._main.setAppMode(eAppMode.AnimateAll);
        return;
      } else {
        this.updateDifficulty();
        this.exitAnimationMode();
      }
    }

    this.main.updateHistory();
    // this._main.recreateForm();
  }

  public exitAnimationMode(): void {
    this.clearAnimations();
    this._active = false;
    this.cfg.appMode = eAppMode.Game;
    // Wird aufgerufen, um den Hint entsprechend zu setzen
    // Point pos = _main.PointToClient(Cursor.Position);
    // _main.MainForm_MouseMove(_main, new MouseEventArgs(MouseButtons.None, 0, pos.X, pos.Y, 0));
    // _main.SetAppMode(eAppMode.Game);
  }

  /**
   * Führt die Lösungsschritte aus, bis nichts mehr geht.
   */
  public doBatch(): void {
    let done = false;
    this._difficulty.clear();
    this.doAfter = undefined;

    while (!done) {
      this.clearAnimations();
      this._solver?.solveStep();
      done = this.animations.length == 0;
      if (!done) {
        this.executeAnimationActions();
      }
    }
    this.updateDifficulty();
  }

  /**
   * Wird aufgerufen, wenn der linke Mousebutton im Editmode
   * gedrückt wird.
   * @param fld Feld auf dem der Button gedrückt wurde.
   */
  public onFieldClicked(fld?: FieldDef): void {
    if (fld == null) {
      return;
    }
    if (this.cfg.isDebug) {
      if (this.main.debugField == null || !fld.equals(this.main.debugField)) {
        this.main.debugField = fld;
      } else {
        this.main.debugField = undefined;
      }
      return;
    }
    switch (this.cfg.appMode) {
      case eAppMode.Edit:
        if (this.main.paintDef.currentCtrl == null) {
          return;
        }
        if (this.main.paintDef.currentCtrl.value === 0) {
          fld.solution = -1;
          fld.type = eFieldType.User;
        } else if (this.main.paintDef.currentCtrl.value === this.cfg.numberCount + 1) {
          fld.solution = -1;
          fld.type = (fld.type === eFieldType.Block ? eFieldType.User : eFieldType.Block);
        } else {
          if (fld.solution === this.main.paintDef.currentCtrl.value) {
            fld.solution = -1;
          } else {
            fld.solution = this.main.paintDef.currentCtrl.value;
          }

          if (fld.type === eFieldType.Block || fld.type === eFieldType.BlockNumber) {
            fld.type = eFieldType.BlockNumber;
          } else {
            fld.type = fld.solution > 0 ? eFieldType.Preset : eFieldType.User;
          }
        }
        fld.value = fld.solution;
        fld.clearHidden();
        this.ruleset.validateFields(false);
        this.cfg.currentBoard(true).content = this.ruleset.getBoardString(false);
        this.cfg.writeSettings();
        return;
      case eAppMode.Game:
        if (fld.type === eFieldType.User) {
          if (this.main.paintDef.currentCtrl != null) {
            fld.value = this.main.paintDef.currentCtrl.value > 0 && this.main.paintDef.currentCtrl.value <= this.cfg.numberCount
              ? (this.main.paintDef.currentCtrl.value === fld.value ? -1
                : this.main.paintDef.currentCtrl.value) : -1;
          } else if (this.cfg.gameMode === eGameMode.Solver) {
            if (fld.value > 0) {
              fld.value = -1;
            }
          }

          fld.clearHidden();
          this.solveExisting();
          this.ruleset.checkSolved(true);
        }
        return;
    }
  }

  /**
   * Durchläuft alle Felder und entfernt alle Kandidaten, die
   * schon als Wert im Bereich stehen.
   */
  public solveExisting(): void {
    for (const fld of this._paintDef.fields) {
      if (fld.value > 0) {
        this.solveExistingCandidates(fld);
      }
    }
  }

  /**
   * Führt die Aktionen der Animationen aus und ändert so das Feld.
   */
  public executeAnimationActions(): void {
    for (const anim of this.animations) {
      if (anim.field != null) {
        const fld = this.main.paintDef.field(anim.field.x, anim.field.y);
        if (fld != null) {
          switch (anim.foreType) {
            case eAnimFore.SetCandidate:
              for (const value of anim.candidates) {
                fld.value = value;
              }
              fld.clearHidden();
              fld.isValid = true;
              break;

            case eAnimFore.DelCandidate:
              for (const value of anim.candidates) {
                fld.getCandidate(value).hidden = true;
              }
              break;
          }
        }
      }
    }

    if (this.doAfter != null) {
      this.doAfter();
    }
  }

  /**
   * Setzt den letzten verbleibenden Kandidaten in das Feld.
   * @protected
   */
  protected solveNakedSingle(): void {
    for (const fld of this._paintDef.fields) {
      if (fld.type != eFieldType.User || fld.value > 0) {
        continue;
      }

      let count = 0;
      let found = 0;
      for (const candidate of fld.candidates) {
        if (!candidate.hidden) {
          found = candidate.value;
          count++;
        }
      }
      if (count === 1) {
        this.setCandidate(fld, eAnimBack.MarkField, found);
        this.setSolution(1, $localize`Die Zahl ${found} ist der letzte verbliebene Kandidat im <span class="MarkField">markierten Feld</span>.`);
        return;
      }
    }
  }

  private updateDifficulty(): void {
    if (!this.ruleset.checkSolved(false)) {
      this._difficulty.clear();
      this._difficulty.set(this.ruleset.maxDifficulty - 1, 1);
    }
    // this._main.difficulty = this.difficulty;
  }

  /**
   * Sucht in der Liste der Animationen eine Animation für ein
   * bestimmtes Feld und gibt ihr den übergebenen Typ für den
   * Hintergrund mit.
   *
   * @param backType Art der Hintergrundanimation.
   * @param fld Das Feld für die Animation.
   * @private
   */
  private getAnimation(backType: eAnimBack, fld: FieldDef): AnimDef {
    let ret = this.animations.find(i => i.field != null && +i.field.x === +fld.x && +i.field.y === +fld.y);
    if (ret == null) {
      ret = new AnimDef(backType, eAnimFore.None, fld);
    } else {
      ret.backType = backType;
    }

    return ret;
  }

  private addAnimation(anim: AnimDef): void {
    this._factor = 0;
    this.animations.push(anim);
  }
}
