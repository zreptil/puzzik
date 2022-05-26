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
    return this.cfg.appMode === eAppMode.Edit || this.cfg.gameMode === eGameMode.Normal;
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
            ret.tip = $localize`Lösungsmodus aktivieren`;
            break;
          case eGameMode.Solver:
            ret.tip = $localize`Lösungsmodus deaktivieren`;
            break;
        }
        ret.hidden = () => this.cfg.appMode === eAppMode.Edit;
        break;
      case 'rulers':
        ret.icon = id;
        ret.tip = $localize`Schaltet die Lineale um`;
        break;
      case 'clearUser':
        ret.icon = 'empty-all-on';
        ret.tip = $localize`Entfernt alle Benutzereinträge`;
        break;
      case 'number':
        ret.value = param === 0 ? -1 : param;
        ret.text = param === 0 ? '' : param;
        ret.marked = (data: ButtonData) => {
          return data?.value === this.main.paintDef.currentCtrl?.value;
        };
        break;
      case 'solver-step':
        ret.icon = id;
        ret.tip = $localize`Ermittelt eine Lösungszahl`;
        break;
      case 'debug':
        ret.icon = 'display';
        ret.tip = $localize`Debugmodus`;
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
            this.ruleset.clearGame();
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
        this.main.confirm($localize`Hiermit werden alle Eingaben des Benutzers gelöscht. Soll das wirklich ausgeführt werden?`).subscribe((btn: DialogButton) => {
          switch (btn?.type) {
            case eDialogButtonType.Yes:
              this.ruleset.clearFields(eFieldType.User);
              this.solver.solveExisting();
              break;
          }
        });
        break;
      case 'number':
        this.main.paintDef.currentCtrl = btn;
        break;
      case 'solver-step':
        this.solver.solveStep();
        break;
      case 'debug':
        this.cfg.isDebug = !this.cfg.isDebug;
        break;
    }
    this.cfg.writeSettings();
  }
}
