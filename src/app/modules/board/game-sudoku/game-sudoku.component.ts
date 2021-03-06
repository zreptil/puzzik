import {Component, OnInit} from '@angular/core';
import {RulesetSudokuService} from '../../../_services/ruleset-sudoku.service';
import {RulesetBaseService} from '../../../_services/ruleset-base.service';
import {eFieldType, FieldDef} from '../../../_model/field-def';
import {ConfigService, eAppMode, eGameMode} from '../../../_services/config.service';
import {TooltipPosition} from '@angular/material/tooltip';
import {FormControl} from '@angular/forms';
import {ButtonData} from '../../controls/button/button.component';
import {DialogButton, eDialogButtonType} from '../../controls/dialog/dialog.component';
import {MainFormService} from '../../../_services/main-form.service';
import {SolverSudokuService} from '../../../_services/solver-sudoku.service';

@Component({
  selector: 'app-game-sudoku',
  templateUrl: './game-sudoku.component.html',
  styleUrls: ['./game-sudoku.component.scss']
})
export class GameSudokuComponent implements OnInit {

  ruleset: RulesetBaseService;
  rows: FieldDef[] = [];

  positionOptions: TooltipPosition[] = ['below', 'above', 'left', 'right'];
  position = new FormControl(this.positionOptions[0]);

  constructor(public cfg: ConfigService,
              ruleset: RulesetSudokuService,
              public solver: SolverSudokuService,
              public main: MainFormService) {
    this.ruleset = ruleset;
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

  classFor(x: number, y: number): string[] {
    const ret: string[] = [];
    if (x === 0) {
      ret.push('left');
    } else if ((x % 3) === 2) {
      ret.push('right');
    }
    if (y === 0) {
      ret.push('top');
    } else if ((y % 3) === 2) {
      ret.push('bottom');
    }
    return ret;
  }

  ngOnInit(): void {
  }

  btnData(id: string, param?: any): ButtonData {
    const ret = new ButtonData(id);
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
            ret.tip = this.cfg.appMode === eAppMode.Edit ? $localize`L??sungsmodus aktivieren` : $localize`L??sungsmodus aktivieren`;
            break;
          case eGameMode.Solver:
            ret.tip = this.cfg.appMode === eAppMode.Edit ? $localize`L??sungsmodus deaktivieren` : $localize`L??sungsmodus deaktivieren`;
            break;
        }
        break;
      case 'rulers':
        ret.icon = id;
        ret.tip = $localize`Schaltet die Lineale um`;
        break;
      case 'clearUser':
        ret.icon = 'empty-all-on';
        ret.tip = this.cfg.appMode === eAppMode.Game ? $localize`Entfernt alle Benutzereintr??ge` : $localize`Entfernt alle Eingaben`;
        break;
      case 'number':
        ret.value = param === 0 ? -1 : param;
        ret.text = param === 0 ? '' : param;
        ret.marked = (data: ButtonData) => {
          return +data?.value === +this.main.paintDef.currentCtrl?.value;
        };
        break;
      case 'solver-step':
        ret.icon = id;
        ret.tip = $localize`Ermittelt ein L??sungsfeld`;
        ret.hidden = () => this.cfg.appMode === eAppMode.Edit;
        break;
      case 'solver-full':
        ret.icon = id;
        ret.tip = $localize`F??hrt die L??sung so weit durch, wie es die Programmlogik zul??sst`;
        ret.hidden = () => this.cfg.appMode === eAppMode.Edit;
        break;
      case 'undo':
        ret.icon = id;
        ret.tip = $localize`Macht den letzten Schritt r??ckg??ngig`;
        ret.hidden = () => this.cfg.appMode === eAppMode.Edit;
        break;
      case 'debug':
        ret.icon = 'display';
        ret.tip = $localize`Debugmodus`;
        break;
      case 'weblink':
        ret.icon = id;
        ret.tip = $localize`Ruft die Webseite zum L??sen des aktuellen Sudokus auf`;
        break;
    }
    return ret;
  }

  btnClick(btn: ButtonData): void {
    switch (btn.id) {
      case 'appMode':
        switch (this.cfg.appMode) {
          case eAppMode.Game:
            this.cfg.appMode = eAppMode.Edit;
            this.solver.solveExisting();
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
        this.ruleset.validateFields(false);
        break;
      case 'rulers':
        this.cfg.showRulers = !this.cfg.showRulers;
        break;
      case 'clearUser':
        this.main.confirm(this.cfg.appMode === eAppMode.Game
          ? $localize`Hiermit werden alle Eingaben des Benutzers gel??scht. Soll das wirklich ausgef??hrt werden?`
          : $localize`Hiermit werden alle Felder gel??scht. Soll das wirklich ausgef??hrt werden?`).subscribe(
          (btn: DialogButton) => {
            switch (btn?.type) {
              case eDialogButtonType.Yes:
                this.ruleset.clearFields(this.cfg.appMode === eAppMode.Game ? eFieldType.User : undefined);
                this.solver.solveExisting();
                this.cfg.currentBoard(true).content = this.ruleset.getBoardString(false);
                this.cfg.writeSettings();
                break;
            }
          });
        break;
      case 'number':
        this.main.paintDef.currentCtrl = btn;
        break;
      case 'solver-step':
        if (this.solver.animations?.length || 0 > 0) {
          this.solver.executeAnimationActions();
          this.solver.initAnimation();
          this.cfg.currentBoard(true).content = this.ruleset.getBoardString(false);
          this.cfg.writeSettings();
        } else {
          this.solver.solveStep();
        }
        break;
      case 'solver-full':
        let done = false;
        while (!done) {
          this.solver.solveStep();
          done = (this.solver.animations?.length || 0) === 0;
          if (!done) {
            this.solver.executeAnimationActions();
          }
        }
        break;
      case 'undo':
        this.main.undoLastStep();
        break;
      case 'debug':
        this.cfg.isDebug = !this.cfg.isDebug;
        break;
      case 'weblink':
        this.main.callWebPage('https://www.sudokuwiki.org/sudoku.htm');
        break;
    }
    this.cfg.writeSettings();
  }
}
