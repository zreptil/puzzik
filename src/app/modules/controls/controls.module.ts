import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FieldSudokuComponent} from './field-sudoku/field-sudoku.component';

@NgModule({
  declarations: [
    FieldSudokuComponent
  ],
  exports: [
    FieldSudokuComponent
  ],
  imports: [
    CommonModule
  ]
})
export class ControlsModule { }
