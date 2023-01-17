import {Component, Input} from '@angular/core';
import {eAnimBack, eAnimFore, eAnimMark, eFieldType, FieldDef} from '../../../_model/field-def';
import {ConfigService, eAppMode, eGameMode} from '../../../_services/config.service';
import {MainFormService} from '../../../_services/main-form.service';
import {AnimDef} from '../../../_model/anim-def';

@Component({
  selector: 'app-field-str8ts',
  templateUrl: './field-str8ts.component.html',
  styleUrls: ['./field-str8ts.component.scss']
})
export class FieldStr8tsComponent {

  @Input()
  field: FieldDef | undefined;

  markThick = '5px';
  markColor = '#88f';

  constructor(public cfg: ConfigService,
              public main: MainFormService) {
  }

  get areaNumber(): string {
    let ret = [];
    for (let idx = 0; idx < this.main.paintDef.areas.length; idx++) {
      if (this.main.paintDef.areas[idx].fields.find(fld => fld.x === this.field?.x && fld.y === this.field?.y) != null) {
        ret.push(`${idx}`);
      }
    }
    return ret.join('/');
  }

  get mode(): number {
    let ret = this.cfg.gameMode === eGameMode.Solver /* && this.cfg.appMode === eAppMode.Game */ ? 0 : 1;
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
      const animList = this.main.solver.animations.filter(anim => anim.field?.equals(fld)) || [];
      for (const anim of animList) {
        if (+anim.backType === eAnimBack.MarkField
          || +anim.backType === eAnimBack.MarkTargetField
          || +anim.backType === eAnimBack.MarkAnchorField) {
          ret.push(`${eAnimBack[anim.backType]}`);
        }
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
      const fld = this.field.clone;
      const anim = this.checkAnim(fld);
      if (anim != null) {
        const check = fld.clone;
        check.x = fld.x - 1;
        if (this.checkAnim(check) == null) {
          shadow.push(`inset ${this.markThick} 0 0 0 ${this.markColor}`);
        }
        check.x = fld.x + 1;
        if (this.checkAnim(check) == null) {
          shadow.push(`inset -${this.markThick} 0 0 0 ${this.markColor}`);
        }
        check.x = fld.x;
        check.y = fld.y - 1;
        if (this.checkAnim(check) == null) {
          shadow.push(`inset 0 ${this.markThick} 0 0 ${this.markColor}`);
        }
        check.y = fld.y + 1;
        if (this.checkAnim(check) == null) {
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
        if ((this.field?.value || 0) <= 0) {
          ret = '';
        }
        break;
    }
    return ret;
  }

  checkAnim(fld: FieldDef): AnimDef | null {
    return this.main.solver?.animations.find(anim => (anim.field?.equals(fld) &&
        (+anim.backType === eAnimBack.MarkRow
          || +anim.backType === eAnimBack.MarkColumn
          || +anim.backType === eAnimBack.MarkArea))
      || false) || null;
  }

  isField(anim: AnimDef): boolean {
    if (this.field != null && anim.field != null) {
      return anim.field.equals(this.field);
    }
    return false;
  }

  candidateClass(idx: number): string[] {
    const ret: string[] = [];
    switch (this.cfg.appMode) {
      case eAppMode.Edit:
        if (this.field?.getCandidate(idx)?.hidden) {
          ret.push('off');
        }
        break;
      case eAppMode.Game:
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
        break;
    }
    return ret;
  }

  clickCandidate(idx: number): void {
    if (this.field == null) {
      return;
    }
    let clearCandidates = false;
    switch (this.cfg.appMode) {
      case eAppMode.Edit:
        this.field.value = idx;
        this.field.type = eFieldType.Preset;
        clearCandidates = true;
        break;
      case eAppMode.Game:
        const candidate = this.field.getCandidate(idx);
        if (candidate != null) {
          candidate.hidden = !candidate.hidden;
          if (this.field.candidates.filter(c => !c.hidden).length === 1) {
            this.field.value = this.field.candidates.find(c => !c.hidden)?.value || 1;
          }
        }
        break;
    }
    this.adjustCandidates(clearCandidates);
  }

  adjustCandidates(clearCandidates: boolean): void {
    if (clearCandidates) {
      for (const fld of this.main.paintDef.fields) {
        fld.clearHidden();
      }
    }
    this.main.solver?.solveExisting();
    this.main.solver?.ruleset.validateFields(false);
    this.cfg.currentBoard(true).content = this.main.solver?.ruleset.getBoardString(true);
    this.cfg.writeSettings();
  }

  clickField(): void {
    if (this.field == null) {
      return;
    }
    switch (this.cfg.appMode) {
      case eAppMode.Edit:
        switch (this.cfg.gameMode) {
          case eGameMode.Normal:
            this.main.solver?.onFieldClicked(this.field);
            break;
          case eGameMode.Solver:
            this.field.type = eFieldType.User;
            this.field.value = -1;
            this.adjustCandidates(true);
            break;
        }
        break;
      case eAppMode.Game:
        this.main.solver?.onFieldClicked(this.field);
        break;
    }
  }
}
