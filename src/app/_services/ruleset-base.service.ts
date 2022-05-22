import {Injectable} from '@angular/core';
import {MainFormService} from './solver-base.service';
import {eFieldType} from '../_model/field-def';

@Injectable({
  providedIn: 'root'
})
export abstract class RulesetBaseService {

  constructor(private _main: MainFormService) {
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
   * Überprüft die Felder auf Korrektheit.
   * @param setValue Wenn true, dann wird ein Kandidat als Feldwert gesetzt,
   *                 wenn es der einzige ist.
   */
  public abstract validateFields(setValue: boolean): void

  /// #############################################################
  /// <summary>
  /// Ermittelt, ob das Spiel gelöst ist
  /// </summary>
  /// <param name="updateSaved">
  /// true, wenn bei gelöstem Spiel die Information über den
  /// Schwierigkeitsgrad gespeichert werden soll.
  /// </param>
  /// #############################################################
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

}
