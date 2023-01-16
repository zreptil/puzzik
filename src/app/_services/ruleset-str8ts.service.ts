import { Injectable } from '@angular/core';
import {RulesetBaseService} from './ruleset-base.service';
import {ConfigService} from './config.service';
import {MainFormService} from './main-form.service';
import {FieldDefService} from './field-def.service';

@Injectable({
  providedIn: 'root'
})
export class RulesetStr8tsService extends RulesetBaseService {

  constructor(cfg: ConfigService,
              _main: MainFormService,
              fds: FieldDefService) {
    super(cfg, _main, fds);
  }

  createAreas(): void {
  }

  getVariations(): number[] {
    return [9, 6];
  }

  validateFields(setValue: boolean): void {
  }
}
