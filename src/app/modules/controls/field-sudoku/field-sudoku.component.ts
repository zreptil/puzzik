import {Component, Input} from '@angular/core';
import {eFieldType, FieldDef} from '../../../_model/field-def';
import {ConfigService, eAppMode, eGameMode} from '../../../_services/config.service';
import {RulesetSudokuService} from '../../../_services/ruleset-sudoku.service';
import {MainFormService} from '../../../_services/main-form.service';

@Component({
  selector: 'app-field-sudoku',
  templateUrl: './field-sudoku.component.html',
  styleUrls: ['./field-sudoku.component.scss']
})
export class FieldSudokuComponent {

  @Input()
  field: FieldDef | undefined;

  constructor(public cfg: ConfigService,
              public main: MainFormService,
              public ruleset: RulesetSudokuService) {
  }

  get mode(): number {
    let ret = this.cfg.gameMode === eGameMode.Solver && this.cfg.appMode === eAppMode.Game ? 0 : 1;
    if ((this.field?.value || 0) > 0) {
      return 1;
    }
    return ret;
  }

  get containerClass(): string[] {
    const ret = ['container'];
    const id = `${eFieldType[this.field?.type || 0]}`;
    ret.push(`type${id}`);
    if (!this.field?.isValid && (this.field?.value || -1) > 0) {
      ret.push(`error${id}`);
    }
    if (this.cfg.isDebug && this.main.debugField != null) {
      for (const {index, area} of this.main.debugField.areas.map((area, index) => ({index, area}))) {
        if (area.fields.find(f => this.field?.equals(f))) {
          ret.push(`fldArea${index}`);
        }
      }
    }
    return ret;
  }

  get value(): string {
    let ret = `${this.field?.value}`;
    switch (this.cfg.appMode) {
      case eAppMode.Game:
        if (isNaN(this.field?.value || NaN) || (this.field?.value || 0) < 1) {
          ret = '';
        }
        break;
      case eAppMode.Edit:
        if (this.field?.type === eFieldType.User) {
          ret = '';
        }
        break;
    }
    return ret;
  }

  candidateClass(idx: number): string[] {
    const ret: string[] = [];
    if (this.field?.getCandidate(idx)?.hidden) {
      ret.push('off');
    }
    return ret;
  }

  clickCandidate(idx: number): void {
    if (this.field == null) {
      return;
    }
    const candidate = this.field.getCandidate(idx);
    if (candidate != null) {
      candidate.hidden = !candidate.hidden;
      if (this.field.candidates.filter(c => !c.hidden).length === 1) {
        this.field.value = this.field.candidates.find(c => !c.hidden)?.value || 1;
      }
      this.main.solver?.solveExisting();
      this.ruleset.validateFields(false);
      this.cfg.currentBoard(true).content = this.ruleset.getBoardString(true);
      this.cfg.writeSettings();
    }
  }

  clickField(): void {
    this.main.solver?.onFieldClicked(this.field);
  }
}
