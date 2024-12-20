import {Injectable} from '@angular/core';
import {SavedBoard} from '@/_model/saved-board';
import {PlayerData} from '@/_model/player-data';

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
    this.addPlayer('Andi', 'blue', 'white');
    this.addPlayer('Mutti', 'green', 'white');
    this.addPlayer('Papi', 'maroon', 'white');
    this.addPlayer('Moni', '#cc6700', 'white');
    this.addPlayer('@preview', 'white', '#bbb');
    this.currPlayerIdx = 0;
  }

  private _currPlayerIdx: number = 0;

  public get currPlayerIdx(): number {
    if (this._currPlayerIdx < 0) {
      this._currPlayerIdx = 0;
    }
    if (this._currPlayerIdx >= this._players.length) {
      this._currPlayerIdx = this._players.length - 1;
    }
    return this._currPlayerIdx;
  }

  public set currPlayerIdx(value: number) {
    if (value < 0) {
      value = 0;
    }
    if (value >= this._players.length) {
      value = this._players.length - 1;
    }
    this._currPlayerIdx = value;
  }

  public get currentPlayer(): PlayerData {
    return this.players[this.currPlayerIdx];
  }

  private _players: PlayerData[] = [];

  public get players(): PlayerData[] {
    return [...this._players];
  }

  public get puzzleId(): string {
    return `${this.puzzleType}${this.numberCount}`;
  }

  public get onlineLink(): string | null {
    return this.currentBoard.webLink ?? null;
  }

  public get currentBoardDifficulty(): number {
    return this.currentBoard.difficulty ?? -1;
  }

  public set currentBoardDifficulty(value: number) {
    this.currentBoard.difficulty = value;
  }

  public get currentBoardName(): string {
    return this.currentBoard.name ?? 'Leer';
  }

  public set currentBoardName(value: string) {
    this.currentBoard.name = value;
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

  public get currentBoard(): SavedBoard {
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

  playerEditStyle(player: PlayerData): any {
    return player.style;
  }

  playerStyle(player: PlayerData, checkCurrent = false, selector = false): any {
    let ret: any = {};
    if (player?.nr >= 1) {
      if (checkCurrent && player.nr === this.currentPlayer.nr) {
        ret = this.appMode === eAppMode.Game ? player.currStyle : player.style;
      } else {
        ret = this.appMode === eAppMode.Game ? player.style : PlayerData.defStyle;
      }
    }
    if (this.appMode === eAppMode.Game && selector) {
      const temp = this.playerEditStyle(this.currentPlayer);
      ret = {color: temp.backgroundColor, backgroundColor: temp.color};
    }
    return ret;
  }

  public addPlayer(name: string, colorBack: string, colorFore: string): void {
    if (this._players.length < 5) {
      this._players.push(new PlayerData(this._players.length + 1, name, colorBack, colorFore));
    }
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

  changePlayerIdx(diff: number, loop = true) {
    switch (diff) {
      case -1:
        if (this.currPlayerIdx === 0) {
          if (loop) {
            this.currPlayerIdx = this._players.length - 1;
          }
        } else {
          this.currPlayerIdx--;
        }
        break;
      case 1:
        if (this.currPlayerIdx >= this._players.length - 1) {
          if (loop) {
            this.currPlayerIdx = 0;
          }
        } else {
          this.currPlayerIdx++;
        }
        break;
    }
  }
}
