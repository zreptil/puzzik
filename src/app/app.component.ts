import {Component} from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'puzzik';

  constructor() {
  }

  // constructor(main: MainFormService,
  //             solver: SolverSudokuService) {
  //   main.reload(solver);
  // }
}
