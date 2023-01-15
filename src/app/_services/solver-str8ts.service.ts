import { Injectable } from '@angular/core';
import {ConfigService} from './config.service';
import {MainFormService} from './main-form.service';
import {RulesetStr8tsService} from './ruleset-str8ts.service';
import {SolverBaseService} from './solver-base.service';
import {FieldDef} from '../_model/field-def';

@Injectable({
  providedIn: 'root'
})
export class SolverStr8tsService extends SolverBaseService {

  constructor(cfg: ConfigService,
              _main: MainFormService,
              ruleset: RulesetStr8tsService) {
    super(cfg, _main, ruleset);
  }

  solveExistingCandidates(fld: FieldDef): void {
  }

  solveStep(): void {
  }

}
