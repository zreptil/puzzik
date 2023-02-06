import {ConfigService} from '@/_services/config.service';

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

  // {"type":"Sudoku9","difficulty":-1,"name":"5.2.2023 (Andi 1, Mutti 2, Papi 3)","content":"01I02G30C01F30D01E03B30A03H30A30D02F30B03H30I02G03E30C01H30B03E30C02G02A30F03D30I03B30I02D03G30A02F30C03H02E30E30H30G01I01B30C30D02F30A01F02C03A30H30E01D03I01G30B30G30E01H30D03I02B02A03C30F30D30F02B01A30C30H30E02I30G03C30A01I30E30F01G30H30B01D"}
}
