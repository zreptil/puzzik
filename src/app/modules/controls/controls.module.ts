import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FieldSudokuComponent} from './field-sudoku/field-sudoku.component';
import {ButtonComponent} from './button/button.component';
import {MaterialModule} from '../../material.module';
import { DialogComponent } from './dialog/dialog.component';
import { FieldStr8tsComponent } from './field-str8ts/field-str8ts.component';

@NgModule({
  declarations: [
    FieldSudokuComponent,
    ButtonComponent,
    DialogComponent,
    FieldStr8tsComponent
  ],
  exports: [
    FieldSudokuComponent,
    FieldStr8tsComponent,
    ButtonComponent
  ],
  imports: [
    CommonModule,
    MaterialModule
  ]
})
export class ControlsModule {
}
