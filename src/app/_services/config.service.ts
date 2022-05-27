import {Injectable} from '@angular/core';
import {SavedBoard} from '../_model/saved-board';

export enum eAppMode {
  Game,
  Edit,
  Load,
  Save,
  Animate,
  AnimateAll,
  Import
}

export enum eGameMode {
  Normal,
  Solver
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  public numberCount = 9;
  public puzzleType = 'Sudoku';
  public devSupport = true;
  public gameMode = eGameMode.Normal;
  public appMode = eAppMode.Game;
  public showRulers = true;
  public isDebug = false;

  public currentBoards: SavedBoard[] = [];

  constructor() {
    this.readSettings();
  }

  public get puzzleId(): string {
    return `${this.puzzleType}${this.numberCount}`;
  }

  public get onlineLink(): string | null {
    return this.currentBoard()?.webLink || null;
  }

  public get currentBoardDifficulty(): number {
    return this.currentBoard()?.difficulty || -1;
  }

  public set currentBoardDifficulty(value: number) {
    this.currentBoard(true).difficulty = value;
  }

  public get currentBoardName(): string {
    return this.currentBoard(false)?.name || 'Leer';
  }

  public set currentBoardName(value: string) {
    this.currentBoard(true).name = value;
  }

  public get puzzleFilename(): string {
    throw 'Die Methode puzzleFilename ist akutell sinnlos. Die Speicherung und das Laden muss noch überdacht werden';
    // return this.getSavePath(String.Format('{0}.{1}.xml', SettingsSX.PuzzleType, SettingsSX.NumberCount));
  }

  public get isGameMode(): boolean {
    return this.appMode === eAppMode.Game || this.isAnimating;
  }

  public get isAnimating(): boolean {
    return this.appMode === eAppMode.Animate || this.appMode === eAppMode.AnimateAll;
  }

  public currentBoard(createIfMissing = false): SavedBoard {
    let brd = this.currentBoards.find(i => i.type === this.puzzleId);
    if (brd == null) {
      brd = new SavedBoard(this);
      brd.type = this.puzzleId;
      brd.name = 'Leer';
      brd.difficulty = -1;
      this.currentBoards.push(brd);
    }
    return brd;
  }

  public readSettings(): void {
    const json = JSON.parse(localStorage.getItem('data')
      || `{"numberCount":${this.numberCount},
"puzzleType":"${this.puzzleType}",
"devSupport":${this.devSupport},
"gameMode":${this.gameMode},
"showRulers":${this.showRulers},
"appMode":${this.appMode}}`);
    this.numberCount = +json.numberCount;
    this.puzzleType = json.puzzleType;
    this.devSupport = json.devSupport;
    this.gameMode = json.gameMode;
    this.appMode = json.appMode;
    this.showRulers = json.showRulers;
    this.currentBoards = [];
    for (const src of json.currentBoards || []) {
      this.currentBoards.push(new SavedBoard(this, src));
    }
  }

  public writeSettings(): void {
    localStorage.setItem('data', JSON.stringify(this));
  }

  /**
   * Erstellt ein Array mit Nummern für die Verwendung
   * in HTML-Seiten in ngFor-Schleifen.
   * @param cnt Benötigte Anzahl an Einträgen
   */
  counter(cnt: number) {
    const ret = [];
    for (let i = 0; i < cnt; i++) {
      ret.push(i);
    }
    return ret;
  }
}
