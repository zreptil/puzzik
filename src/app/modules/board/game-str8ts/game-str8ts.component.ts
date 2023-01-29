import {Component, OnInit} from '@angular/core';
import {FieldDef} from '@/_model/field-def';
import {LegacyTooltipPosition as TooltipPosition} from '@angular/material/legacy-tooltip';
import {UntypedFormControl} from '@angular/forms';
import {ConfigService} from '@/_services/config.service';
import {MainFormService} from '@/_services/main-form.service';
import {SolverStr8tsService} from '@/_services/solver-str8ts.service';

@Component({
  selector: 'app-game-str8ts',
  templateUrl: './game-str8ts.component.html',
  styleUrls: ['./game-str8ts.component.scss']
})
export class GameStr8tsComponent implements OnInit {
  rows: FieldDef[] = [];

  positionOptions: TooltipPosition[] = ['below', 'above', 'left', 'right'];
  position = new UntypedFormControl(this.positionOptions[0]);

  constructor(public cfg: ConfigService,
              public solver: SolverStr8tsService,
              public main: MainFormService) {
  }

  ngOnInit(): void {
  }

}
