import {Component, Input, OnInit} from '@angular/core';
import {eFieldType, FieldDef} from '../../../_model/field-def';
import {ConfigService, eGameMode} from '../../../_services/config.service';

@Component({
  selector: 'app-field-sudoku',
  templateUrl: './field-sudoku.component.html',
  styleUrls: ['./field-sudoku.component.scss']
})
export class FieldSudokuComponent implements OnInit {

  @Input()
  field: FieldDef | undefined;

  constructor(public cfg: ConfigService) {
  }

  get mode(): number {
    let ret = this.cfg.gameMode === eGameMode.Solver ? 0 : 1;
    if ((this.field?.value || 0) > 0) {
      return 1;
    }
    return ret;
  }

  get containerClass(): string[] {
    const ret = ['container'];
    const id = `${eFieldType[this.field?.type || 0]}`;
    ret.push(`type${id}`);
    if (!this.field?.isValid) {
      ret.push(`error${id}`);
    }
    return ret;
  }

  get value(): string {
    let ret = `${this.field?.value}`;
    if (isNaN(this.field?.value || NaN) || (this.field?.value || 0) < 1) {
      ret = '';
    }
    return ret;
  }

  ngOnInit(): void {
  }

}
