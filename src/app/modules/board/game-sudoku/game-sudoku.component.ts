import {Component, OnInit} from '@angular/core';
import {FieldDef} from '../../../_model/field-def';
import {ConfigService} from '../../../_services/config.service';
import {TooltipPosition} from '@angular/material/tooltip';
import {FormControl} from '@angular/forms';
import {MainFormService} from '../../../_services/main-form.service';
import {SolverSudokuService} from '../../../_services/solver-sudoku.service';

@Component({
  selector: 'app-game-sudoku',
  templateUrl: './game-sudoku.component.html',
  styleUrls: ['./game-sudoku.component.scss']
})
export class GameSudokuComponent implements OnInit {

  rows: FieldDef[] = [];

  positionOptions: TooltipPosition[] = ['below', 'above', 'left', 'right'];
  position = new FormControl(this.positionOptions[0]);

  constructor(public cfg: ConfigService,
              public solver: SolverSudokuService,
              public main: MainFormService) {
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
}
