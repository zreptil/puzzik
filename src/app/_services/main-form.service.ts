import {Injectable} from '@angular/core';
import {eFieldType, FieldDef} from '@/_model/field-def';
import {FieldDefService} from './field-def.service';
import {SolverBaseService} from './solver-base.service';
import {ConfigService, eAppMode, eGameMode} from './config.service';
import {MatDialog} from '@angular/material/dialog';
import {DialogButton, DialogComponent, DialogData, eDialogButtonType} from '@/modules/controls/dialog/dialog.component';
import {Observable} from 'rxjs';
import {ButtonData} from '@/modules/controls/button/button.component';
import {PaintDefinitions} from '@/_model/paint-definitions';

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

  get gridStyle(): string {
    let count = this.paintDef.boardCols;
    if (this.cfg.showRulers) {
      count += 2;
    }
    return `grid-template-columns:repeat(${count},1fr)`;
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

  get isNumbersVisible(): boolean {
    switch (this.cfg.appMode) {
      case eAppMode.Edit:
        return this.cfg.gameMode === eGameMode.Normal;
      case eAppMode.Game:
        return this.cfg.gameMode === eGameMode.Normal;
    }
    return false;
  }

  calcSquare() {
    let count = this.paintDef.boardCols;
    if (this.cfg.showRulers) {
      count += 2;
    }
    const grid = document.getElementById('grid');
    const hig = grid.clientHeight;

    for (let idx = 0; idx < grid.children.length; idx++) {
      const child = grid.children.item(idx);
      child.setAttribute('style', `width:${hig / count}px`);
    }
    grid.setAttribute('style', `width:${hig}px;${this.gridStyle}`);
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

  fieldStyle(field: FieldDef): any {
    const ret: any = {};
    if (field?.type === eFieldType.User && field?.playerNr >= 1) {
      const temp = this.cfg.playerStyle(this.cfg.players[field.playerNr - 1]);
      ret.backgroundColor = temp.color;
      ret.color = temp.backgroundColor;
      if (temp.mark != null) {
        ret.backgroundColor = temp.mark;
      }
      if (!field.isValid) {
        ret.color = 'red';
      }
      if (field?.playerNr === this.cfg.players.length && this.solver.isLowestPreviewIdx(field)) {
        ret.color = 'yellow';
        ret.fontWeight = 'bold';
      }
    }
    return ret;
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
      if (variations[i] === this.cfg.numberCount) {
        found = i;
      }
    }
    solver.ruleset.setNumberCount(variations[found]);
    solver.ruleset.fillBoard(solver.ruleset.currentBoard, false);
    this.solver = solver;
    this.solver.ruleset.createAreas();
    solver.ruleset.validateFields(false);

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
    url = url.replace(/@bs@/g, this.boardString);
    console.log('auf gehts', url);
    window.open(url, 'puzzik');
  }

  btnData(id: string, solver: SolverBaseService, param?: any): ButtonData {
    const ret = new ButtonData(id, solver);
    ret.click = this.btnClick.bind(this);
    switch (id) {
      case 'appMode':
        ret.icon = `appMode${eAppMode[this.cfg.appMode]}`;
        switch (this.cfg.appMode) {
          case eAppMode.Game:
            ret.tip = $localize`Zum Editiermodus wechseln`;
            break;
          case eAppMode.Edit:
            ret.tip = $localize`Zum Spielmodus wechseln`;
            break;
        }
        break;
      case 'gameMode':
        ret.icon = `gameMode${eGameMode[this.cfg.gameMode]}`;
        switch (this.cfg.gameMode) {
          case eGameMode.Normal:
            ret.tip = this.cfg.appMode === eAppMode.Edit ? $localize`Lösungsmodus aktivieren` : $localize`Lösungsmodus aktivieren`;
            break;
          case eGameMode.Solver:
            ret.tip = this.cfg.appMode === eAppMode.Edit ? $localize`Lösungsmodus deaktivieren` : $localize`Lösungsmodus deaktivieren`;
            break;
        }
        break;
      case 'rulers':
        ret.icon = id;
        ret.tip = $localize`Schaltet die Lineale um`;
        break;
      case 'clearUser':
        ret.icon = 'empty-all-on';
        ret.tip = this.cfg.appMode === eAppMode.Game ? $localize`Entfernt alle Benutzereinträge` : $localize`Entfernt alle Eingaben`;
        break;
      case 'block':
        ret.value = param === 0 ? -1 : param;
        ret.text = '';
        ret.marked = (data: ButtonData) => {
          return +data?.value === +this.paintDef.currentCtrl?.value;
        };
        ret.hidden = () => this.cfg.appMode !== eAppMode.Edit;
        break;
      case 'number':
        ret.value = param === 0 ? -1 : param;
        ret.text = param === 0 ? '' : param;
        ret.marked = (data: ButtonData) => {
          return +data?.value === +this.paintDef.currentCtrl?.value;
        };
        break;
      case 'solver-step':
        ret.icon = id;
        ret.tip = $localize`Ermittelt ein Lösungsfeld`;
        ret.hidden = () => this.cfg.appMode === eAppMode.Edit || this.cfg.gameMode !== eGameMode.Solver;
        break;
      case 'solver-full':
        ret.icon = id;
        ret.tip = $localize`Führt die Lösung so weit durch, wie es die Programmlogik zulässt`;
        ret.hidden = () => this.cfg.appMode === eAppMode.Edit || this.cfg.gameMode !== eGameMode.Solver;
        break;
      case 'undo':
        ret.icon = id;
        ret.tip = $localize`Macht den letzten Schritt rückgängig`;
        ret.hidden = () => this.cfg.appMode === eAppMode.Edit;
        break;
      case 'debug':
        ret.icon = 'display';
        ret.tip = $localize`Debugmodus`;
        break;
      case 'solverlink':
        ret.icon = 'weblink';
        ret.tip = $localize`Ruft die Webseite zum Lösen des aktuellen Sudokus auf`;
        ret.hidden = () => this.cfg.currentBoard.solverLink == null;
        break;
      case 'weblink':
        ret.icon = id;
        ret.tip = $localize`Ruft die Webseite für ${this.cfg.puzzleType} auf`;
        ret.hidden = () => this.cfg.currentBoard.webLink == null;
        break;
      case 'player':
        ret.player = param;
        break;
    }
    return ret;
  }

  btnClick(btn: ButtonData) {
    switch (btn.id) {
      case 'appMode':
        switch (this.cfg.appMode) {
          case eAppMode.Game:
            this.cfg.appMode = eAppMode.Edit;
            btn.solver?.solveExisting();
            break;
          case eAppMode.Edit:
            this.cfg.appMode = eAppMode.Game;
            break;
        }
        break;
      case 'gameMode':
        switch (this.cfg.gameMode) {
          case eGameMode.Normal:
            this.cfg.gameMode = eGameMode.Solver;
            break;
          case eGameMode.Solver:
            this.cfg.gameMode = eGameMode.Normal;
            break;
        }
        btn.solver?.ruleset.validateFields(false);
        break;
      case 'rulers':
        this.cfg.showRulers = !this.cfg.showRulers;
        setTimeout(() => this.calcSquare(), 100);
        break;
      case 'clearUser':
        this.confirm(this.cfg.appMode === eAppMode.Game
          ? $localize`Hiermit werden alle Eingaben des Benutzers gelöscht. Soll das wirklich ausgeführt werden?`
          : $localize`Hiermit werden alle Felder gelöscht. Soll das wirklich ausgeführt werden?`).subscribe(
          (dlgBtn: DialogButton) => {
            switch (dlgBtn?.type) {
              case eDialogButtonType.Yes:
                btn.solver?.ruleset.clearFields(this.cfg.appMode === eAppMode.Game ? eFieldType.User : undefined);
                btn.solver?.solveExisting();
                this.cfg.currentBoard.content = btn.solver?.ruleset.getBoardString(false);
                this.cfg.writeSettings();
                break;
            }
          });
        break;
      case 'number':
      case 'block':
        this.paintDef.currentCtrl = btn;
        break;
      case 'solver-step':
        if (btn.solver?.animations?.length || 0 > 0) {
          btn.solver?.executeAnimationActions();
          btn.solver?.initAnimation();
          this.cfg.currentBoard.content = btn.solver?.ruleset.getBoardString(false);
          this.cfg.writeSettings();
        } else {
          btn.solver?.solveStep();
        }
        break;
      case 'solver-full':
        let done = false;
        while (!done) {
          btn.solver?.solveStep();
          done = (btn.solver?.animations?.length || 0) === 0;
          if (!done) {
            btn.solver?.executeAnimationActions();
          }
        }
        break;
      case 'undo':
        this.undoLastStep();
        break;
      case 'debug':
        this.cfg.isDebug = !this.cfg.isDebug;
        break;
      case 'weblink':
        this.callWebPage(this.cfg.currentBoard.webLink ?? '');
        break;
      case 'solverlink':
        this.callWebPage(this.cfg.currentBoard.solverLink ?? '');
        break;
      case 'player':
        this.cfg.currPlayerIdx = this.cfg.players.findIndex(p => p.nr === btn.player.nr);
        break;
    }
    this.cfg.writeSettings();
  }

  classFor(x: number, y: number, cls?: string): string[] {
    const ret: string[] = [];
    if (x === 0) {
      ret.push('left');
    } else if (x === this.cfg.numberCount - 1) {
      ret.push('right');
    }
    if (y === 0) {
      ret.push('top');
    } else if (y === this.cfg.numberCount - 1) {
      ret.push('bottom');
    }
    if (cls != null) {
      ret.push(cls);
    }
    return ret;
  }
}
