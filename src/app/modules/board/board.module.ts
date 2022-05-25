import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {GameSudokuComponent} from './game-sudoku/game-sudoku.component';
import {GameBoardComponent} from './game-board/game-board.component';
import {ControlsModule} from '../controls/controls.module';
import {MaterialModule} from '../../material.module';

@NgModule({
  declarations: [
    GameSudokuComponent,
    GameBoardComponent
  ],
  exports: [
    GameBoardComponent,
    GameSudokuComponent
  ],
  imports: [
    CommonModule,
    ControlsModule,
    MaterialModule
  ]
})
export class BoardModule {
}
