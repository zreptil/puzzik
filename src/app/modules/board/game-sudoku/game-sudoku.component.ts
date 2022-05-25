import {Component, OnInit} from '@angular/core';
import {RulesetSudokuService} from '../../../_services/ruleset-sudoku.service';
import {RulesetBaseService} from '../../../_services/ruleset-base.service';
import {FieldDef} from '../../../_model/field-def';
import {ConfigService, eAppMode} from '../../../_services/config.service';

@Component({
  selector: 'app-game-sudoku',
  templateUrl: './game-sudoku.component.html',
  styleUrls: ['./game-sudoku.component.scss']
})
export class GameSudokuComponent implements OnInit {

  ruleset: RulesetBaseService;
  rows: FieldDef[] = [];

  constructor(public cfg: ConfigService,
              ruleset: RulesetSudokuService) {
    this.ruleset = ruleset;
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

  btnClass(key: string): string[] {
    const ret = ['btn'];
    switch (key) {
      case 'appMode':
        ret.push(`appMode${eAppMode[this.cfg.appMode]}`);
        break;
    }
    return ret;
  }

  btnClick(key: string): void {
    switch (key) {
      case 'appMode':
        switch (this.cfg.appMode) {
          case eAppMode.Game:
            this.cfg.appMode = eAppMode.Edit;
            break;
          case eAppMode.Edit:
            this.cfg.appMode = eAppMode.Game;
            break;
        }
        break;
    }
  }
}
