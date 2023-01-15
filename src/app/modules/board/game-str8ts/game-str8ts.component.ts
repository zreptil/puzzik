import { Component, OnInit } from '@angular/core';
import {RulesetBaseService} from '../../../_services/ruleset-base.service';
import {FieldDef} from '../../../_model/field-def';
import {TooltipPosition} from '@angular/material/tooltip';
import {FormControl} from '@angular/forms';
import {ConfigService} from '../../../_services/config.service';
import {SolverSudokuService} from '../../../_services/solver-sudoku.service';
import {MainFormService} from '../../../_services/main-form.service';
import {RulesetStr8tsService} from '../../../_services/ruleset-str8ts.service';

@Component({
  selector: 'app-game-str8ts',
  templateUrl: './game-str8ts.component.html',
  styleUrls: ['./game-str8ts.component.scss']
})
export class GameStr8tsComponent implements OnInit {
  ruleset: RulesetBaseService;
  rows: FieldDef[] = [];

  positionOptions: TooltipPosition[] = ['below', 'above', 'left', 'right'];
  position = new FormControl(this.positionOptions[0]);

  constructor(public cfg: ConfigService,
              ruleset: RulesetStr8tsService,
              public solver: SolverSudokuService,
              public main: MainFormService) {
    this.ruleset = ruleset;
  }

  ngOnInit(): void {
  }

}
