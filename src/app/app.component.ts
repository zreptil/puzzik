import {Component} from '@angular/core';
import {MainFormService} from './_services/main-form.service';
import {SolverSudokuService} from './_services/solver-sudoku.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'puzzik';

  constructor(main: MainFormService,
              sudoku: SolverSudokuService) {
    main.reload(sudoku);
  }
}
