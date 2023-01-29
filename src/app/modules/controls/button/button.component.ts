import {Component, Input, OnInit} from '@angular/core';
import {SolverBaseService} from '@/_services/solver-base.service';
import {RulesetBaseService} from '@/_services/ruleset-base.service';
import {ConfigService} from '@/_services/config.service';

export class ButtonData {
  icon?: string;
  text?: string;
  value?: any;
  tip?: string;
  click?: (btn: ButtonData) => void;
  marked?: (btn: ButtonData) => boolean;

  constructor(public id: string,
              public solver?: SolverBaseService) {
  }

  hidden: () => boolean = () => false;
}

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss']
})
export class ButtonComponent implements OnInit {
  @Input()
  data?: ButtonData;

  constructor(public cfg: ConfigService,
              public solver: SolverBaseService,
              public ruleset: RulesetBaseService) {
  }

  get btnClass(): string[] {
    const ret = ['button', 'mat-elevation-z1'];
    if (this.data?.marked?.(this.data)) {
      ret.push('marked');
    }
    if (this.data?.id === 'block') {
      ret.push('block');
    }
    if (this.data?.id === 'user') {
      ret.push('user');
    }
    return ret;
  }

  ngOnInit(): void {
  }

  btnClick() {
    this.data?.click?.(this.data);
  }
}
