import {Component, HostListener, OnInit} from '@angular/core';
import {MainFormService} from '@/_services/main-form.service';
import {ButtonData} from '@/modules/controls/button/button.component';
import {SolverSudokuService} from '@/_services/solver-sudoku.service';
import {SolverStr8tsService} from '@/_services/solver-str8ts.service';

@Component({
  selector: 'app-game-board',
  templateUrl: './game-board.component.html',
  styleUrls: ['./game-board.component.scss']
})
export class GameBoardComponent implements OnInit {

  constructor(public main: MainFormService,
              public sudoku: SolverSudokuService,
              public str8ts: SolverStr8tsService) {
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
      solver: this.main.solver,
      click(_btn: ButtonData): void {
      }, hidden(): boolean {
        return false;
      }, icon: '', marked(_btn: ButtonData): boolean {
        return false;
      }, text: '', tip: '', value: key === '0' ? '-1' : key,
    };
  }

  ngOnInit(): void {
    this.main.cfg.readSettings();
    this.reload(this.main.cfg.puzzleType);
  }

  reload(id: string, diff = 0): void {
    const types = [
      {id: 'Sudoku', solver: this.sudoku},
      {id: 'Str8ts', solver: this.str8ts}
    ];
    let idx = types.findIndex(item => item.id === id) ?? -diff;
    idx += diff;
    if (idx >= types.length) {
      idx = 0;
    }
    this.main.cfg.puzzleType = types[idx].id;
    this.main.reload(types[idx].solver);
    this.main.cfg.writeSettings();
  }

  btnTypeClick() {
    this.reload(this.main.cfg.puzzleType, 1);
  }
}
