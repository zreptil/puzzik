import {AfterViewInit, Component, OnInit} from '@angular/core';
import {FieldDef} from '@/_model/field-def';
import {ConfigService} from '@/_services/config.service';
import {LegacyTooltipPosition as TooltipPosition} from '@angular/material/legacy-tooltip';
import {UntypedFormControl} from '@angular/forms';
import {MainFormService} from '@/_services/main-form.service';
import {SolverSudokuService} from '@/_services/solver-sudoku.service';

@Component({
  selector: 'app-game-sudoku',
  templateUrl: './game-sudoku.component.html',
  styleUrls: ['./game-sudoku.component.scss']
})
export class GameSudokuComponent implements OnInit, AfterViewInit {

  rows: FieldDef[] = [];

  positionOptions: TooltipPosition[] = ['below', 'above', 'left', 'right'];
  position = new UntypedFormControl(this.positionOptions[0]);

  constructor(public cfg: ConfigService,
              public solver: SolverSudokuService,
              public main: MainFormService) {
  }

  classFor(x: number, y: number): string[] {
    const ret: string[] = ['cell'];
    if (x === 0) {
      ret.push('left');
    } else if ((x % 3) === 2) {
      ret.push('right');
    }
    if (y === 0 || ((y % 3) === 0)) {
      ret.push('top');
    } else if ((y % 3) === 2) {
      ret.push('bottom');
    }
    return ret;
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.main.calcSquare(), 100);
  }
}
