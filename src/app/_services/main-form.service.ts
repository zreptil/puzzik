import {Injectable} from '@angular/core';
import {eFieldType, FieldDef} from '../_model/field-def';
import {FieldDefService} from './field-def.service';
import {PaintDefinitions} from './solver-base.service';
import {RulesetBaseService} from './ruleset-base.service';
import {ConfigService} from './config.service';

@Injectable({
  providedIn: 'root'
})
export abstract class MainFormService {
  public paintDef: PaintDefinitions;
  private _historyBoard!: FieldDef[] | null;
  private _history!: FieldDef[][];
  private _ruleset!: RulesetBaseService;

  constructor(public cfg: ConfigService,
              fds: FieldDefService) {
    this.paintDef = new PaintDefinitions(fds);
  }

  private _hint: string = '';

  public set hint(value: string) {
    this._hint = value;
    // this.invalidate();
  }

  /**
   * Speichert das Feld zur Historisierung zwischen.
   */
  public memorizeBoard(): void {
    this._historyBoard = [];
    for (const fld of this.paintDef.fields) {
      this._historyBoard.push(fld.clone);
    }
  }

  /**
   * Stellt den Zustand beim letzten MemorizeBoard wieder her.
   */
  public undoLastStep(): void {
    if (this._history != null && this._history.length > 0) {
      for (const fld of this._history[this._history.length - 1]) {
        const dst = this.paintDef.fields.find(f => f.x === fld.x && f.y === fld.y);
        if (dst != null) {
          dst.copyFrom(fld);
        }
      }
      this._history.splice(this._history.length - 1, 1);
      this._historyBoard = null;
    }
  }

  /**
   * Überprüft, ob sich das Feld seit dem letzten Aufruf von
   * MemorizeBoard geändert hat. Wenn das der Fall ist, dann
   * wird ein History-Eintrag erstellt.
   */
  public updateHistory(): void {
    if (this._historyBoard == null) {
      return;
    }

    const history = [];

    for (let i = 0; i < this.paintDef.fields.length; i++) {
      const fld = this.paintDef.fields[i];
      if (fld.type == eFieldType.User && fld.isChanged(this._historyBoard[i])) {
        history.push(this._historyBoard[i]);
      }
    }

    if (history.length > 0) {
      if (this._history == null) {
        this._history = [];
      }
      this._history.push(history);
    }

    this._historyBoard = null;
  }

  /**
   * Lädt die Anwendung.
   * @param ruleset Ruleset, der verwendet werden soll
   */
  public reload(ruleset: RulesetBaseService): void {
    this._history = [];
    // Prüfen, ob die Variation im RuleSet vorhanden ist
    const variations = ruleset.getVariations();
    let found = 0;
    for (let i = 0; i < variations.length; i++) {
      if (variations[i] == this.cfg.numberCount) {
        found = i;
      }
    }
    ruleset.setNumberCount(variations[found]);
    ruleset.fillBoard(ruleset.currentBoard, false);
    ruleset.validateFields(false);
    this._ruleset = ruleset;

    /*
    PaintDef.SmallLine = (int)Math.Sqrt(SettingsSX.NumberCount);
    if (PaintDef.SmallLine * PaintDef.SmallLine < SettingsSX.NumberCount)
      PaintDef.SmallLine++;

    FillPuzzleCombo();

    _ruleSet.FillBoard(_ruleSet.CurrentBoard, false);
    SetAppMode(SettingsSX.AppMode);
    SetGameMode(SettingsSX.GameMode);

    if (SettingsSX.ClientSize.Width < MinimumSize.Width || SettingsSX.ClientSize.Height < MinimumSize.Height)
      SettingsSX.ClientSize = MinimumSize;
    PaintDef.InvalidCtrls = true;
    PaintDef.InvalidBoard = true;
    PaintDef.InvalidHint = true;
    PaintDef.InvalidArea = true;
    Invalidate();
    */
  }
}
