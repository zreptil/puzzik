import {Injectable} from '@angular/core';
import {eFieldType, FieldDef} from '../_model/field-def';
import {FieldDefService} from './field-def.service';
import {PaintDefinitions, SolverBaseService} from './solver-base.service';
import {ConfigService} from './config.service';
import {MatDialog} from '@angular/material/dialog';
import {
  DialogButton,
  DialogComponent,
  DialogData,
  eDialogButtonType
} from '../modules/controls/dialog/dialog.component';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export abstract class MainFormService {
  public paintDef: PaintDefinitions;
  public debugField?: FieldDef;
  public solver?: SolverBaseService;
  private historyBoard?: FieldDef[] | null;
  private history?: FieldDef[][];

  constructor(public cfg: ConfigService,
              fds: FieldDefService,
              public dialog: MatDialog) {
    this.paintDef = new PaintDefinitions(fds);
  }

  private _hint: string = '';

  public set hint(value: string) {
    this._hint = value;
  }

  public get boardString(): string {
    let ret = '';
    let val;
    for (let y = 0; y < this.paintDef.boardRows; y++) {
      for (let x = 0; x < this.paintDef.boardCols; x++) {
        const fld = this.paintDef.field(x, y);
        if (fld.value > 0) {
          val = fld.value.toString();
        } else {
          val = '0';
        }
        ret += val;
      }
    }
    return ret;
  }

  public confirm(text: string): Observable<DialogButton> {
    const data = new DialogData($localize`Bestätigung`, text, [{label: $localize`Ja`, type: eDialogButtonType.Yes}, {
      label: $localize`Nein`,
      type: eDialogButtonType.No
    }]);
    const dialogRef = this.dialog.open(DialogComponent, {
      data
    });
    return dialogRef.afterClosed();
  }

  /**
   * Speichert das Feld zur Historisierung zwischen.
   */
  public memorizeBoard(): void {
    this.historyBoard = [];
    for (const fld of this.paintDef.fields) {
      this.historyBoard.push(fld.clone);
    }
  }

  /**
   * Stellt den Zustand beim letzten MemorizeBoard wieder her.
   */
  public undoLastStep(): void {
    if (this.history != null && this.history?.length > 0) {
      for (const fld of this.history[this.history.length - 1]) {
        const dst = this.paintDef.field(fld.x, fld.y);
        if (dst != null) {
          dst.copyFrom(fld);
        }
      }
      this.history.splice(this.history.length - 1, 1);
      this.historyBoard = null;
    }
  }

  /**
   * Überprüft, ob sich das Feld seit dem letzten Aufruf von
   * MemorizeBoard geändert hat. Wenn das der Fall ist, dann
   * wird ein History-Eintrag erstellt.
   */
  public updateHistory(): void {
    if (this.historyBoard == null) {
      return;
    }

    const history = [];

    for (let i = 0; i < this.paintDef.fields.length; i++) {
      const fld = this.paintDef.fields[i];
      if (fld.type === eFieldType.User && fld.isChanged(this.historyBoard[i])) {
        history.push(this.historyBoard[i]);
      }
    }

    if (history.length > 0) {
      if (this.history == null) {
        this.history = [];
      }
      this.history.push(history);
    }

    this.historyBoard = null;
  }

  /**
   * Lädt die Anwendung.
   * @param solver Solver, der verwendet werden soll
   */
  public reload(solver: SolverBaseService): void {
    this.history = [];
    // Prüfen, ob die Variation im RuleSet vorhanden ist
    const variations = solver.ruleset.getVariations();
    let found = 0;
    for (let i = 0; i < variations.length; i++) {
      if (variations[i] == this.cfg.numberCount) {
        found = i;
      }
    }
    solver.ruleset.setNumberCount(variations[found]);
    solver.ruleset.fillBoard(solver.ruleset.currentBoard, false);
    solver.ruleset.validateFields(false);
    this.solver = solver;

    /*
    PaintDef.SmallLine = (int)Math.Sqrt(SettingsSX.NumberCount);
    if (PaintDef.SmallLine * PaintDef.SmallLine < SettingsSX.NumberCount)
      PaintDef.SmallLine++;

    FillPuzzleCombo();

    _ruleSet.FillBoard(_ruleSet.CurrentBoard, false);
    SetAppMode(SettingsSX.AppMode);
    SetGameMode(SettingsSX.GameMode);

    if (SettingsSX.ClientSize.Width < MinimumSize.Width || SettingsSX.ClientSize.Height < MinimumSize.Height)
      SettingsSX.ClientSize = MinimumSize;
    PaintDef.InvalidCtrls = true;
    PaintDef.InvalidBoard = true;
    PaintDef.InvalidHint = true;
    PaintDef.InvalidArea = true;
    Invalidate();
    */
  }

  /**
   * Ruft eine Webseite auf.
   * @param url Webadresse
   */
  public callWebPage(url: string): void {
    window.open(`${url}?bd=${this.boardString}`, 'Oleole');
  }

}
