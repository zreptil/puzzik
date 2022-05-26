import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FieldSudokuComponent} from './field-sudoku/field-sudoku.component';
import {ButtonComponent} from './button/button.component';
import {MaterialModule} from '../../material.module';
import { DialogComponent } from './dialog/dialog.component';

@NgModule({
  declarations: [
    FieldSudokuComponent,
    ButtonComponent,
    DialogComponent
  ],
  exports: [
    FieldSudokuComponent,
    ButtonComponent
  ],
  imports: [
    CommonModule,
    MaterialModule
  ]
})
export class ControlsModule {
}
