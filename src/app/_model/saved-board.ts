import {ConfigService} from '../_services/config.service';

export class SavedBoard {
  public type?: string;
  public difficulty?: number;
  public name?: string;
  public content?: string;
  public style?: number;

  constructor(cfg: ConfigService, src?: any) {
    switch (cfg.puzzleId) {
    }

    if (src != null) {
      if (typeof (src) === 'string') {
        src = JSON.parse(src);
      }
      this.type = src.type;
      this.difficulty = src.difficulty;
      this.name = src.name;
      this.content = src.content;
      this.style = src.style;
    }
  }

  public get webLink(): string | null {
    switch (this.type) {
      case 'Str8ts6':
        return 'https://www.str8ts.com/daily_mini_str8ts.aspx';
      case 'Str8ts9':
        return 'https://www.str8ts.com/Daily_str8ts';
      case 'Sudoku9':
        return 'http://www.str8ts.com/daily_sudoku.asp';
      case '1to257':
        return 'http://www.1to25.com/1_to_25_Daily.html';
      case 'Kakuro9':
        return 'http://www.kakuro-world.com/kakuroonline.html';
    }
    return null;
  }

  public get solverLink(): string | null {
    switch (this.type) {
      case 'Sudoku9':
        return 'https://www.sudokuwiki.org/sudoku.htm?bd=@bs@';
    }
    return null;
  }
}
