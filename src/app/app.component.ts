import { Component } from '@angular/core';
import {MainFormService} from './_services/main-form.service';
import {RulesetSudokuService} from './_services/ruleset-sudoku.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'puzzik';

  constructor(main: MainFormService,
              sudoku: RulesetSudokuService) {
    main.reload(sudoku);
  }
}
