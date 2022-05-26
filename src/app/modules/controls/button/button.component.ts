import {Component, Input, OnInit} from '@angular/core';

export class ButtonData {
  icon?: string;
  text?: string;
  value?: any;
  tip?: string;
  click?: (btn: ButtonData) => void;
  marked?: (btn: ButtonData) => boolean;

  constructor(public id: string) {
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

  constructor() {
  }

  get btnClass(): string[] {
    const ret = ['button', 'mat-elevation-z1'];
    if (this.data?.marked?.(this.data)) {
      ret.push('marked');
    }
    return ret;
  }

  ngOnInit(): void {
  }

  btnClick() {
    this.data?.click?.(this.data);
  }
}
