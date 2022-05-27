import {Component, HostListener, OnInit} from '@angular/core';
import {MainFormService} from '../../../_services/main-form.service';
import {ButtonData} from '../../controls/button/button.component';

@Component({
  selector: 'app-game-board',
  templateUrl: './game-board.component.html',
  styleUrls: ['./game-board.component.scss']
})
export class GameBoardComponent implements OnInit {

  constructor(public main: MainFormService) {
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    if (event.key >= '0' && event.key <= '9') {
      this.keyClick(event.key);
    }
  }

  keyClick(key: string): void {
    this.main.paintDef.currentCtrl = {
      id: 'number',
      click(btn: ButtonData): void {
      }, hidden(): boolean {
        return false;
      }, icon: '', marked(btn: ButtonData): boolean {
        return false;
      }, text: '', tip: '', value: key === '0' ? '-1' : key
    };
  }

  ngOnInit(): void {
  }

}
