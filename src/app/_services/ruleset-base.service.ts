import {Injectable} from '@angular/core';
import {eFieldType, FieldDef} from '../_model/field-def';
import {FieldDefService} from './field-def.service';
import {MainFormService} from './main-form.service';
import {ConfigService, eGameMode} from './config.service';
import {eDialogButtonType} from '../modules/controls/dialog/dialog.component';

@Injectable({
  providedIn: 'root'
})
export abstract class RulesetBaseService {

  _currentStyle?: number;

  constructor(public cfg: ConfigService,
              public _main: MainFormService,
              public fds: FieldDefService) {
  }

  /**
   * Ermittelt den minimalen Wert für die Schwierigkeit einer Lösung.
   */
  public get minDifficulty(): number {
    return 0;
  }

  /**
   * Ermittelt den maximalen Wert für die Schwierigkeit einer Lösung.
   */
  public get maxDifficulty(): number {
    return 0;
  }

  /**
   * Ermittelt das aktuelle Spielfeld.
   */
  public get currentBoard(): string {
    const brd = this.cfg.currentBoard;
    let ret = '';
    this._currentStyle = 0;
    const len = this._main.paintDef.boardCols * this._main.paintDef.boardRows;
    if (brd == null || brd.content == null || (brd.content.length != len * 6 && brd.content.length != len * 2)) {
      for (let i = 0; i < this._main.paintDef.boardCols * this._main.paintDef.boardRows; i++) {
        ret += this.getFieldString(this.fds.create(), true);
      }
    } else {
      this._currentStyle = brd.style;
      ret = brd.content;
    }
    // ret = '0A01bf0E01ef3I00000H017f0C01fb0B01fd0A01fe3F00000D01f73D00000F01df0C01fb0I00ff0G01bf3A00000E01ef0H017f0B01fd0H017f3A00003B00003E00000D01f70F01df0I00ff0C01fb0G01bf0A01fe0C01fb0E01ef3G00003I00000H017f0B01fd0D01f70F01df0B01fd0G01bf0D01f70F01df0A01fe3C00003H00000I00ff3E00000I00ff0H017f0F01df0B01fd0E01ef3D00000G01bf0A01fe3C00000F01df0I00ff3H00000D01f70B01fd0G01bf0C01fb3E00003A00003C00000D01f73G00000A01fe3H00000E01ef0F01df3B00000I00ff3E00000B01fd0A01fe3C00000F01df0I00ff0D01f70G01bf3H0000';
    // ret = '0G01bf0E01ef3I00000H017f0C01fb0B01fd0A01fe3F00000D01f73D00000F01df0C01fb0I00ff0G01bf3A00000E01ef0H017f0B01fd0H017f3A00003B00003E00000D01f70F01df0I00ff0C01fb0G01bf0A01fe0C01fb0E01ef3G00003I00000H017f0B01fd0D01f70F01df0B01fd0G01bf0D01f70F01df0A01fe3C00003H00000I00ff3E00000I00ff0H017f0F01df0B01fd0E01ef3D00000G01bf0A01fe3C00000F01df0I00ff3H00000D01f70B01fd0G01bf0C01fb3E00003A00003C00000D01f73G00000A01fe3H00000E01ef0F01df3B00000I00ff3E00000B01fd0A01fe3C00000F01df0I00ff0D01f70G01bf3H0000';
    // brd.content = ret;
    this.createAreas();
    return ret;
  }

  /**
   * Setzt das aktuelle Spielfeld.
   * @param value Spielfeld als String;
   */
  public set currentBoard(value: string) {
    this.cfg.currentBoard.content = value;
  }

  colName(x: number): string {
    return String.fromCharCode(x + 65);
  }

  rowName(y: number): string {
    return `${y + 1}`;
  }

  /**
   * Ermittelt die möglichen Variationen.
   */
  public abstract getVariations(): number[];

  /**
   * Überprüft die Felder auf Korrektheit.
   * @param setValue Wenn true, dann wird ein Kandidat als Feldwert gesetzt,
   *                 wenn es der einzige ist.
   * @returns true, wenn ein Kandidat als Feldwert gesetzt wurde
   */
  public abstract validateFields(setValue: boolean): boolean

  /**
   * Erstellt die benötigten Bereiche
   */
  public abstract createAreas(): void;

  public clearFields(type?: eFieldType): void {
    for (const fld of this._main.paintDef.fields) {
      fld.isValid = true;
      if (type == null || fld.type === type) {
        fld.value = -1;
        if (type == null) {
          fld.type = eFieldType.User;
        }
        fld.clearHidden();
        // 0@701bf0@501ef3@900000@01750@301fb0@017d0@101fe3@600000@01f53@400000@015f0@301fb0@007d0@019d3@100000@501ef0@003f0@00bd0@015f3@100003@200003@500000@01970@001f0@00b70@301fb0@00b70@017c0@301fb0@501ef3@700003@900000@017d0@01d50@01f60@01d50@00fd0@00bd0@401f70@601df0@101fe3@300003@800000@00bf3@500000@007c0@003d0@601df0@017d0@501ef3@400000@00bd0@00be3@300000@00dd0@00d53@800000@00f50@01950@009d0@301fb3@500003@100003@300000@00d73@700000@101fe3@800000@501ef0@00d73@200000@00d73@500000@00d50@101fe3@300000@01950@009d0@00970@00b73@80000
      }
    }
  }

  /**
   * Wird ausgeführt, wenn der Deletebutton im Gamemodus gedrückt wird.
   */
  public clearGame(): void {
    let hasHidden = false;
    for (const fld of this._main.paintDef.fields) {
      if (fld.value > 0) {
        continue;
      }

      let check = 1;
      for (const candidate of fld.candidates) {
        if (candidate.hidden) {
          hasHidden = true;
        }
        check <<= 1;
      }
    }

    if (hasHidden && this.cfg.gameMode === eGameMode.Solver) {
      this._main.confirm($localize`Sollen die Möglichkeitsausschlüsse zurückgesetzt werden?`).subscribe(result => {
        if (result.type === eDialogButtonType.Yes) {
          for (const fld of this._main.paintDef.fields) {
            if (fld.type === eFieldType.User) {
              fld.clearHidden();
            }
          }
        }
      });
    } else {
      this._main.confirm($localize`Sollen alle Benutzereingaben gelöscht werden?`).subscribe(result => {
        if (result.type === eDialogButtonType.Yes) {
          for (const fld of this._main.paintDef.fields) {
            if (fld.type == eFieldType.User) {
              fld.value = -1;
              fld.clearHidden();
            }
          }
        }
      });
    }
  }

  /**
   * Ermittelt, ob das Spiel gelöst ist
   * @param updateSaved true, wenn bei gelöstem Spiel die Information über den
   *                    Schwierigkeitsgrad gespeichert werden soll.
   */
  public checkSolved(updateSaved: boolean): boolean {
    this.validateFields(false);
    for (const fld of this._main.paintDef.fields) {
      if (fld.type == eFieldType.User) {
        if (fld.value <= 0 || (fld.value > 0 && !fld.isValid)) {
          return false;
        }
      }
    }

    if (!updateSaved) {
      return true;
    }

    for (const fld of this._main.paintDef.fields) {
      fld.solution = fld.value;
      fld.hiddenValue = 0;
      fld.clearHidden();
    }

// const solution = this.getBoardString(true);
// XmlDocument xml = new XmlDocument();
// try
// {
//   xml.Load(SettingsSX.PuzzleFilename);
//   XmlNode puzzle = xml.SelectSingleNode(String.Format("/root/puzzle[@name='{0}']", SettingsSX.CurrentBoardName));
//   if (solution != puzzle.InnerText)
//   {
//     puzzle.InnerText = solution;
//     XmlAttribute attr = xml.CreateAttribute("solved");
//     attr.Value = "true";
//     puzzle.Attributes.Append(attr);
//
//     if (_main.Difficulty >= 0)
//     {
//       attr = xml.CreateAttribute("difficulty");
//       attr.Value = _main.Difficulty.ToString();
//       puzzle.Attributes.Append(attr);
//     }
//
//     xml.Save(SettingsSX.PuzzleFilename);
//   }
// }
// catch
// {
// }

// this._main.invalidate();
    // MsgBox.Show("Herzlichen Glückwunsch, die Lösung ist richtig!", "Gelöst", MessageBoxButtons.OK, MessageBoxIcon.Information);

    return true;
  }

  /**
   * Gibt den String zurück, der das aktuelle Brett darstellt.
   * @param withCandidates Wenn true, dann die Kandidaten mit in den String speichern.
   */
  public getBoardString(withCandidates: boolean): string {
    let ret = '';

    for (let y = 0; y < this._main.paintDef.boardRows; y++) {
      for (let x = 0; x < this._main.paintDef.boardCols; x++) {
        ret += this.getFieldString(this._main.paintDef.field(x, y), withCandidates);
      }
    }
    return ret;
  }

  /**
   * Befüllt das Feld mit den Informationen aus einem String.
   * @param def String mit den Daten für die Felder.
   * @param clearUser true, wenn die Userfelder geleert werden sollen.
   */
  public fillBoard(def: string, clearUser: boolean): void {
    if (def.length != this._main.paintDef.boardRows * this._main.paintDef.boardCols * 6
      && def.length != this._main.paintDef.boardCols * this._main.paintDef.boardRows * 2) {

      def = '';
      for (let i = 0; i < this._main.paintDef.boardRows * this._main.paintDef.boardCols * 6; i++) {
        def += '0';
      }
    }
    let idx = 0;
    let len = def.length / (this._main.paintDef.boardRows * this._main.paintDef.boardCols);
    for (let y = 0; y < this._main.paintDef.boardRows; y++) {
      for (let x = 0; x < this._main.paintDef.boardCols; x++) {
        this._main.paintDef.setField(x, y, this.createField(def.substring(idx, idx + len), x, y, clearUser));
        idx += len;
      }
    }
  }

  /**
   * Setzt die Anzahl an Nummern, die das Puzzle verwendet.
   * @param cnt Anzahl an Nummern.
   */
  public setNumberCount(cnt: number): void {
    this.cfg.numberCount = cnt;
    // this._main.paintDef.fields = new FieldDef[cnt, cnt];
    this._main.paintDef.boardRows = cnt;
    this._main.paintDef.boardCols = cnt;
  }

  /**
   * Ermittelt den String, der ein Feld definiert.
   * @param fld Das Feld.
   * @param withHidden wenn true, dann wird die Eigenschaft Hidden mit ausgegeben.
   * @returns Der String, der das Feld definiert.
   */
  protected getFieldString(fld: FieldDef, withHidden: boolean): string {
    const v = '@'.charCodeAt(0) + (+fld.value <= 0 ? 0 : +fld.value);
    let ret = `${fld.type}${String.fromCharCode(v)}`;
    if (withHidden) {
      ret += fld.hiddenString;
    }
    return ret;
  }

  /**
   * Erzeugt eine Instanz der Klasse FieldDef.
   * @param def String mit Definition.
   * @param x X-Koordinate im Feld.
   * @param y Y-Koordinate im Feld.
   * @param clearUser true, wenn die Userfelder geleert werden sollen.
   * @protected
   */
  protected createField(def: string, x: number, y: number, clearUser: boolean): FieldDef {
    const ret: FieldDef = this.fds.create();
    if (+def[0] >= 0 && +def[0] < eFieldType.MAX) {
      ret.type = +def[0];
      ret.solution = def.charCodeAt(1) - '@'.charCodeAt(0);
      if (def[1] === '@') {
        ret.value = -1;
      } else {
        ret.value = ret.solution;
      }
      def = def.substring(2);
      if (def === '') {
        def = '0000';
      }

      switch (ret.type) {
        case eFieldType.User:
          if (clearUser) {
            ret.value = -1;
            def = '0000';
          }
          break;

        case eFieldType.Block:
        case eFieldType.BlockNumber:
        case eFieldType.Preset:
          def = '0000';
          break;
      }

      ret.x = x;
      ret.y = y;

      let hidden;
      let check = 1;

      hidden = parseInt(def, 16);
      for (const candidate of ret.candidates) {
        candidate.hidden = ((hidden & check) == check);
        check <<= 1;
      }
    }
    return ret;
  }
}
