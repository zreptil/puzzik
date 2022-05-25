import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppComponent} from './app.component';
import {BoardModule} from './modules/board/board.module';
import {ControlsModule} from './modules/controls/controls.module';
import {HttpClientModule} from '@angular/common/http';
import {MaterialModule} from './material.module';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    BoardModule,
    ControlsModule,
    MaterialModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
