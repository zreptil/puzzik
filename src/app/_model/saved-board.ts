import {ConfigService} from '../_services/config.service';

export class SavedBoard {
  public type?: string;
  public difficulty?: number;
  public name?: string;
  public content?: string;
  public style?: number;
  public webLink?: string;

  constructor(cfg: ConfigService, src?: any) {
    switch (cfg.puzzleId) {
      case 'Str8ts6':
        this.webLink = 'http://www.str8ts.com/daily_mini_str8ts.asp';
        break;
      case 'Str8ts9':
        this.webLink = 'http://www.str8ts.com/daily_str8ts.asp|http://www.derwesten.de/spiele/derwesten-spiele';
        break;
      case 'Sudoku9':
        this.webLink = 'http://www.str8ts.com/daily_sudoku.asp';
        break;
      case '1to257':
        this.webLink = 'http://www.1to25.com/1_to_25_Daily.html';
        break;
      case 'Kakuro9':
        this.webLink = 'http://www.kakuro-world.com/kakuroonline.html';
        break;
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
}
