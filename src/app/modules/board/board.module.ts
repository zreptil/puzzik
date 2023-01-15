import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {GameSudokuComponent} from './game-sudoku/game-sudoku.component';
import {GameBoardComponent} from './game-board/game-board.component';
import {ControlsModule} from '../controls/controls.module';
import {MaterialModule} from '../../material.module';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { GameStr8tsComponent } from './game-str8ts/game-str8ts.component';

@NgModule({
  declarations: [
    GameSudokuComponent,
    GameBoardComponent,
    GameStr8tsComponent
  ],
  exports: [
    GameBoardComponent,
    GameSudokuComponent,
    GameStr8tsComponent
  ],
  imports: [
    CommonModule,
    ControlsModule,
    MaterialModule,
    BrowserAnimationsModule
  ]
})
export class BoardModule {
}
