import {Component, Input} from '@angular/core';
import {eAnimBack, eAnimFore, eAnimMark, eFieldType, FieldDef} from '../../../_model/field-def';
import {ConfigService, eAppMode, eGameMode} from '../../../_services/config.service';
import {MainFormService} from '../../../_services/main-form.service';

@Component({
  selector: 'app-field-sudoku',
  templateUrl: './field-sudoku.component.html',
  styleUrls: ['./field-sudoku.component.scss']
})
export class FieldSudokuComponent {

  @Input()
  field: FieldDef | undefined;

  markThick = '5px';
  markColor = '#88f';

  constructor(public cfg: ConfigService,
              public main: MainFormService) {
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
    if (this.cfg.appMode === eAppMode.Game && this.field != null && this.main.solver?.hasAnimation) {
      const fld = this.field;
      const anim = this.main.solver.animations.find(anim => anim.field?.equals(fld));
      if (anim != null && anim.backType === eAnimBack.MarkField) {
        ret.push(`${eAnimBack[anim.backType]}`);
      }
    }
    return ret;
  }

  get containerStyle(): any {
    let ret: any = {};
    if (this.cfg.appMode !== eAppMode.Game) {
      return ret;
    }
    const shadow = [];
    if (this.field != null && this.main.solver?.hasAnimation) {
      const fld = this.field;
      const anim = this.main.solver.animations.find(anim => anim.field?.equals(fld));
      if (anim != null) {
        const check = this.field.clone;
        check.x = this.field.x - 1;
        if (this.main.solver.animations.find(anim => anim.field?.equals(check)) == null) {
          shadow.push(`inset ${this.markThick} 0 0 0 ${this.markColor}`);
        }
        check.x = this.field.x + 1;
        if (this.main.solver.animations.find(anim => anim.field?.equals(check)) == null) {
          shadow.push(`inset -${this.markThick} 0 0 0 ${this.markColor}`);
        }
        check.x = this.field.x;
        check.y = this.field.y - 1;
        if (this.main.solver.animations.find(anim => anim.field?.equals(check)) == null) {
          shadow.push(`inset 0 ${this.markThick} 0 0 ${this.markColor}`);
        }
        check.y = this.field.y + 1;
        if (this.main.solver.animations.find(anim => anim.field?.equals(check)) == null) {
          shadow.push(`inset 0 -${this.markThick} 0 0 ${this.markColor}`);
        }
      }
    }
    if (shadow.length > 0) {
      ret = {'box-shadow': `${shadow.join(',')}`};
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
    } else if (this.field != null && this.main.solver?.hasAnimation) {
      const fld = this.field;
      let anim = this.main.solver.animations.find(anim => anim.field?.equals(fld) && anim.foreType === eAnimFore.DelCandidate && anim.candidates.find(c => +c === +idx));
      if (anim != null) {
        ret.push('delCandidate');
        return ret;
      }
      anim = this.main.solver.animations.find(anim => anim.field?.equals(fld) && anim.foreType === eAnimFore.SetCandidate && anim.candidates.find(c => +c === +idx));
      if (anim != null) {
        ret.push('setCandidate');
        return ret;
      }
      anim = this.main.solver.animations.find(anim => anim.field?.equals(fld) && anim.foreType === eAnimFore.MarkCandidate && anim.candidates.find(c => +c === +idx));
      if (anim != null) {
        switch (anim.candidateMarks[idx]) {
          case eAnimMark.Mark:
            ret.push('markCandidate');
            break;
          case eAnimMark.Show:
            ret.push('showCandidate');
            break;
        }
      }
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
      this.main.solver?.ruleset.validateFields(false);
      this.cfg.currentBoard(true).content = this.main.solver?.ruleset.getBoardString(true);
      this.cfg.writeSettings();
    }
  }

  clickField(): void {
    this.main.solver?.onFieldClicked(this.field);
  }
}
