import {Component, HostListener} from '@angular/core';
import {MainFormService} from './_services/main-form.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'puzzik';

  constructor(public main: MainFormService) {
  }

  @HostListener('wheel', ['$event'])
  public onScroll(event: WheelEvent) {
    const diff = Math.sign(event.deltaY);
    let v = +this.main.paintDef.currentCtrl?.value + diff;
    if (isNaN(v)) {
      v = 1;
    }
    const ctrl = this.main.solver?.controls.find(ctrl => ctrl.value === v && !ctrl.hidden());
    if (ctrl != null) {
      this.main.paintDef.currentCtrl = ctrl;
    }
  }
}
