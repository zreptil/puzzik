import {Injectable} from '@angular/core';
import {eFieldType, FieldDef} from '../_model/field-def';
import {Area} from '../_model/area';
import {RulesetBaseService} from './ruleset-base.service';
import {eAppMode, eGameMode, EnvironmentService} from './environment.service';

export enum eAnimBack {
  None,
  MarkField,
  MarkRow,
  MarkColumn,
  MarkArea
}

export enum eAnimFore {
  None,
  SetCandidate,
  DelCandidate,
  MarkCandidate,
  MarkLink
}

export enum eAnimMark {
  Mark,
  Show
}

/// #############################################################
/// <summary>
/// Klasse, um eine Liste von Feldern zu verwalten, die einen
/// bestimmten Kandidaten beinhalten und jeweil die einzigen
/// Felder in einer Einheit sind, die diesen Kandidaten
/// beinhalten.
/// </summary>
/// #############################################################
class LinkedCandidates {
  public fields: FieldDef[] = [];

  public constructor(public area: Area, public candidate: number) {
  }
}

class AnimDef {
  public field: FieldDef | null = null;
  public candidates: number[] = [];
  public candidateMarks: eAnimMark[];
  public link: LinkedCandidates | null = null;

  public constructor(public backType: eAnimBack, public foreType: eAnimFore, field: FieldDef | null) {
    if (field != null) {
      this.field = field.clone;
    }
    this.candidates = [];
    this.candidateMarks = [20];
  }
}

type SolveFn = () => void;

class PaintDefinitions {
  public fields: FieldDef[] = [];
}

@Injectable({
  providedIn: 'root'
})
export abstract class MainFormService {
  public paintDef: PaintDefinitions = new PaintDefinitions();
  private _historyBoard: FieldDef[] | null = null;
  private _history: FieldDef[][] | null = null;
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
}

@Injectable({
  providedIn: 'root'
})
export abstract class SolverBaseService {

  public doAfter?: SolveFn;
  protected _paintDef: PaintDefinitions;
  protected _solver: SolverBaseService | null = null;
  private _animations: AnimDef[];
  private _factor = 1.0;
  private _xPos = 0;
  private _yPos = 0;
  private _active = false;
  private _preHint = '@308030ffffff@';
  private _colMarkArea = 0x80ff80ff; // Color.FromArgb(255, 100, 255, 100);
  private _colMarkCandidate = 0xffff8080; // Color.FromArgb(255, 100, 100, 255);
  private _colFontCandidate = 0xffffffff; // Color.FromArgb(255, 255, 255, 255);
  private _colFontCandidateDel = 0xffffffff; //Color.FromArgb(255, 255, 255, 255);

  /// #############################################################
  /// <summary>
  /// Initialisiert eine neue Instanz von SolverBase.
  /// </summary>
  /// <param name="main">Das Hauptfenster der Anwendung.</param>
  /// #############################################################
  public constructor(public env: EnvironmentService,
                     private _main: MainFormService,
                     public ruleset: RulesetBaseService) {
    this._paintDef = _main.paintDef;
    this._animations = [];
  }

  private _speed = 0.1;

  public get speed(): number {
    return this._speed;
  }

  public set speed(value: number) {
    this._speed = value;
  }

  private _difficulty: Map<number, number> = new Map<number, number>();

  /**
   * Ermittelt oder setzt den Schwierigkeitsgrad.
   */
  public get difficulty(): number {
    let ret = 0;

    for (const key of this._difficulty.keys()) {
      ret += (this._difficulty.get(key) || 0) * (key + 1);
    }

    return ret;
  }

  public set difficulty(value: number) {
    this._difficulty.set(value, (this._difficulty.get(value) || 0) + 1);
  }

  private _hint: string | null = null;

  public get hint(): string {
    return this._hint || '';
  }

  public get hasAnimation(): boolean {
    return this._animations?.length > 0;
  }

  /**
   * Ermittelt ob ein Sover verfügbar ist oder nicht.
   */
  public get isAvailable(): boolean {
    return false;
  }

  public get hasCandidateTip(): boolean {
    for (const anim of this._animations || []) {
      if (anim.foreType == eAnimFore.SetCandidate) {
        return true;
      }
    }
    return false;
  }

  public get isActive(): boolean {
    return this._active;
  }

  public get count(): number {
    return this._animations?.length || 0;
  }

  public get diffString(): string {
    let ret = '';

    for (const key of this._difficulty.keys()) {
      const val = this._difficulty.get(key) || 0;
      ret = `${val} x Schwierigkeitsgrad ${key} => ${val * key}`;
    }
    //    ret += String.Format("{1} x Schwierigkeitsgrad {0} => {2}\n", val, _difficulty[val], _difficulty[val] * (val + 1));

    ret += `\nSchwierigkeitsgrad: ${this.difficulty}`;

    return ret;
  }

  /**
   * Versucht auf dem aktuellen Spielfeld eine Lösung für eine
   * Zahl oder den Ausschluss von Zahlen zu finden.
   */
  public abstract solveStep(): void;

  /**
   * Entfernt die kleinen Zahlen für die Lösungssuche soweit es
   * die Information des angegebenen Feldes zulassen.
   */
  public abstract solveExisting(fld: FieldDef): void;

  /**
   * Setzt den Schwierigkeitsgrad der ermittelten Lösung und den
   * Hinweis, der dem Benutzer angezeigt wird.
   */
  public SetSolution(difficulty: number, hint: string): void {
    this.difficulty = difficulty;
    if (this.env.devSupport) {
      this._hint = `${hint} (Schwierigkeit: ${difficulty})`;
    } else {
      this._hint = `${hint}`;
    }
  }

  /**
   * Löscht die Animationsliste.
   */
  public clear(): void {
    this._animations = [];
  }

  /**
   * Setzt den Schwierigkeitsgrad zurück.
   */
  public resetDifficulty(): void {
    this._difficulty = new Map<number, number>();
  }

  /**
   * Initialisiert die Animation.
   */
  public initAnimation(): void {
    this._factor = 1.0;
    this._animations = [];
    this._hint = '';
    this._main.memorizeBoard();
  }

  /**
   * Markiert jedes Feld eines Bereichs.
   * @param area Der zu markierende Bereich.
   */
  public markArea(area: Area): void {
    for (const fld of area.fields) {
      const anim = this._animations.find(i => i.field != null && i.field.x === fld.x && i.field.y === fld.y && i.backType === area.backType);
      if (anim != null) {
        continue;
      }
      this.addAnimation(this.getAnimation(area.backType, fld));
    }
  }

  /**
   * Markiert ein Feld.
   * @param fld Das zu markierende Feld.
   * @param backType Art der Hintergrundanimation für das Feld.
   */
  public markField(fld: FieldDef, backType = eAnimBack.MarkField): void {
    this.addAnimation(this.getAnimation(backType, fld));
  }

  /**
   * Markiert einen Link.
   * @param link Der zu markierende Link.
   */
  public markLink(link: LinkedCandidates): void {
    const anim = new AnimDef(eAnimBack.None, eAnimFore.MarkLink, null);
    anim.link = link;
    this.addAnimation(anim);
  }

  /**
   * Löscht einen Kandidaten.
   * @param fld Feld des Kandidaten.
   * @param backType Hintergrundtyp für das Feld.
   * @param candidate Zu löschender Kandidat.
   */
  public delCandidate(fld: FieldDef, backType: eAnimBack, candidate: number): void {
    let anim = this._animations.find(a => a.field != null && a.field.x === fld.x && a.field.y === fld.y && a.foreType === eAnimFore.DelCandidate);
    if (anim == null) {
      anim = new AnimDef(backType, eAnimFore.DelCandidate, fld);
    }
    if (anim.candidates.find(f => f === candidate) != null) {
      return;
    }
    anim.candidates.push(candidate);
    this.addAnimation(anim);
  }

  /**
   * Setzt einen Kandidaten.
   * @param fld Feld des Kandidaten.
   * @param backType Hintergrundtyp für das Feld.
   * @param candidate Zu setzender Kandidat.
   */
  public setCandidate(fld: FieldDef, backType: eAnimBack, candidate: number): void {
    let anim = new AnimDef(backType, eAnimFore.SetCandidate, fld);
    anim.candidates.push(candidate);
    this.addAnimation(anim);
  }

  /**
   * Markiert einen Kandidaten.
   * @param fld Feld des Kandidaten.
   * @param backType Hintergrundtyp für das Feld.
   * @param candidate Zu markierender Kandidat.
   * @param markType Art der Markierung.
   */
  public markCandidate(fld: FieldDef, backType: eAnimBack, candidate: number, markType = eAnimMark.Mark): void {
    let anim = this._animations.find(a => a.field != null && a.field.x === fld.x && a.field.y === fld.y && a.foreType === eAnimFore.MarkCandidate);
    if (anim == null) {
      anim = new AnimDef(backType, eAnimFore.MarkCandidate, fld);
    }

    if (anim.candidates.find(c => c === candidate) != null) {
      return;
    }

    anim.candidates.push(candidate);
    anim.candidateMarks[candidate] = markType;
    this.addAnimation(anim);
  }

  /**
   * Markiert mehrere Kandidaten in einem Feld.
   * @param fld Feld der Kandidaten.
   * @param backType Hintergrundtyp für das Feld.
   * @param candidates Liste der Kandidaten.
   */
  public markCandidates(fld: FieldDef, backType: eAnimBack, candidates: number[]): void {
    const anim = new AnimDef(backType, eAnimFore.MarkCandidate, fld);
    anim.candidates = candidates;
    this.addAnimation(anim);
  }

  /**
   * Führt die Aktionen der Animationen aus und ändert so das Feld.
   */
  public executeAnimationActions(): void {
    for (const anim of this._animations) {
      if (anim?.field !== null) {
        const fld = this._main.paintDef.fields.find(f => f.x === anim.field?.x && f.y === anim.field?.y);
        if (fld != null) {
          switch (anim.foreType) {
            case eAnimFore.SetCandidate:
              for (const value of anim.candidates) {
                fld.value = value;
              }
              fld.clearHidden();
              fld.isValid = true;
              break;

            case eAnimFore.DelCandidate:
              for (const value of anim.candidates) {
                fld.getCandidate(value).hidden = true;
              }
              // this._main.validate();
              break;
          }
        }
      }
    }

    if (this.doAfter != null) {
      this.doAfter();
    }
  }

  public stopAnimation(): void
  {
    if (this.env.gameMode != eGameMode.Solver)  {
      return;
    }

    this.executeAnimationActions();

    if (this._animations.length === 0)
    {
      this._main.hint = $localize`${this._preHint}Ich konnte aufgrund der mir bekannten Algorithmen keine weitere logische Schlussfolgerung ziehen.`;
    }
    else if (this.env.appMode == eAppMode.AnimateAll)
    {
      this._main.updateHistory();
      // this._main.recreateForm();
      this._animations = [];
      this._solver?.solveStep();
      if (this._animations.length > 0)
      {
        // this._main.setAppMode(eAppMode.AnimateAll);
        return;
      }
      else
      {
        this.updateDifficulty();
        this.exitAnimationMode();
      }
    }

    this._main.updateHistory();
    // this._main.recreateForm();
  }

  public exitAnimationMode(): void
  {
    this._animations = [];
    this._active = false;
    this.env.appMode = eAppMode.Game;
    // Wird aufgerufen, um den Hint entsprechend zu setzen
    // Point pos = _main.PointToClient(Cursor.Position);
    // _main.MainForm_MouseMove(_main, new MouseEventArgs(MouseButtons.None, 0, pos.X, pos.Y, 0));
    // _main.SetAppMode(eAppMode.Game);
  }

  private updateDifficulty(): void
  {
    if (!this.ruleset.checkSolved(false))
    {
      this._difficulty.clear();
      this._difficulty.set(this.ruleset.maxDifficulty - 1, 1);
    }
    // this._main.difficulty = this.difficulty;
  }

  /**
   * Sucht in der Liste der Animationen eine Animation für ein
   * bestimmtes Feld und gibt ihr den übergebenen Typ für den
   * Hintergrund mit.
   *
   * @param backType Art der Hintergrundanimation.
   * @param fld Das Feld für die Animation.
   * @private
   */
  private getAnimation(backType: eAnimBack, fld: FieldDef): AnimDef {
    let ret = this._animations.find(i => i.field != null && i.field.x == fld.x && i.field.y == fld.y);
    if (ret == null) {
      ret = new AnimDef(backType, eAnimFore.None, fld);
    } else {
      ret.backType = backType;
    }

    return ret;
  }

  private addAnimation(anim: AnimDef): void {
    this._factor = 0;
    this._animations.push(anim);
  }
}

/*
  /// #############################################################
  /// <summary>
  /// Basisklasse für Lösungsklassen
  /// </summary>
  /// #############################################################
  internal abstract class SolverBase
  {
/// #############################################################
/// <summary>
/// Führt die Lösungsschritte aus, bis nichts mehr geht.
/// </summary>
/// #############################################################
public void DoBatch()
{
  bool done = false;
  _difficulty.Clear();
  DoAfter = null;

  while (!done)
  {
    _animations.Clear();
    _solver.SolveStep();
    done = _animations.Count == 0;
    if(!done)
      ExecuteAnimationActions();
  }
  UpdateDifficulty();
}

#endregion -------------------------------------------------------------------------

  #region PrivateMethods -------------------------------------------------------------

/// <summary>
/// Ermittelt den Farbwert von zwei Farben anhand eines prozentualen
/// Faktors.
/// </summary>
/// <param name="col1">Erste Farbe, entspricht <paramref name="factor"/> 0,0.</param>
/// <param name="col2">Zweite Farbe, entspricht <paramref name="factor"/> 1,0.</param>
/// <param name="factor">
/// Faktor für die Überblendung.
/// 0,0 entspricht <paramref name="col1" />
/// 1,0 entspricht <paramref name="col2" />
/// </param>
/// <returns>Die gemischte Farbe.</returns>
private Color Blend(Color col1, Color col2, double amount)
{
  amount = Math.Max(0, amount);
  amount = Math.Min(1, amount);

  byte r = (byte)((col2.R * amount) + col1.R * (1 - amount));
  byte g = (byte)((col2.G * amount) + col1.G * (1 - amount));
  byte b = (byte)((col2.B * amount) + col1.B * (1 - amount));

  return Color.FromArgb(r, g, b);
}

private void PaintCandidate(AnimDef anim, int i, Font font, Brush col, int x, int y, SizeF size)
{
  switch (anim.ForeType)
  {
    case eAnimFore.SetCandidate:
      if (anim.Candidates.Contains(i))
      {
        float fntSize = _main.PaintDef.SmallFont.Size + (_main.PaintDef.UserFont.Size - _main.PaintDef.SmallFont.Size) * _factor;
        font = new Font(_main.PaintDef.UserFont.FontFamily, fntSize, _main.PaintDef.UserFont.Style);
        size = _main.PaintDef.Gfx.MeasureString(i.ToString(), font);
        x = (int)(x + (_xPos - x + _main.PaintDef.FldWid / 2) * _factor);
        y = (int)(y + (_yPos - y + _main.PaintDef.FldHig / 2) * _factor);
      }
      else
      {
        col = new SolidBrush(Color.FromArgb(255, (int)(_factor * 255), 0, (int)(255 - _factor * 255)));
      }
      break;

    case eAnimFore.MarkCandidate:
      if (anim.Candidates.Contains(i))
      {
        int wid = _main.PaintDef.FldWid / (_main.PaintDef.SmallLine + 1);
        int hig = _main.PaintDef.FldHig / (_main.PaintDef.SmallLine + 1);
        int alpha = (int)(128 + Math.Cos(_factor * 4 * Math.PI) * 127);
        switch (anim.CandidateMarks[i])
        {
          case eAnimMark.Mark:
            col = new SolidBrush(Color.FromArgb(alpha, _colFontCandidate));
            alpha = (int)(_factor * 255);
            _main.PaintDef.Gfx.FillRectangle(new SolidBrush(Color.FromArgb(alpha, _colMarkCandidate)), new Rectangle(x - wid / 2, y - hig / 2, wid, hig));
            break;
          case eAnimMark.Show:
            alpha = (int)(_factor * 255);
            _main.PaintDef.Gfx.DrawEllipse(new Pen(Color.FromArgb(alpha, _colMarkCandidate)), new Rectangle(x - wid / 2, y - hig / 2, wid, hig));
            break;
        }
      }
      break;

    case eAnimFore.DelCandidate:
      if (anim.Candidates.Contains(i))
      {
        int wid = _main.PaintDef.FldWid / (_main.PaintDef.SmallLine + 1);
        int hig = _main.PaintDef.FldHig / (_main.PaintDef.SmallLine + 1);
        int alpha = (int)(128 + Math.Cos(_factor * 4 * Math.PI) * 127);
        col = new SolidBrush(Color.FromArgb(alpha, _colFontCandidate));
        alpha = (int)(_factor * 255);
        _main.PaintDef.Gfx.FillRectangle(new SolidBrush(Color.FromArgb(alpha, Color.FromArgb(255, 255, 100, 100))), new Rectangle(x - wid / 2, y - hig / 2, wid, hig));
        //            _main.PaintDef.Gfx.FillRectangle(new SolidBrush(Color.FromArgb(255, 255, 100, 100)), new Rectangle(x - wid / 2, y - hig / 2, wid, hig));
        //             float fntSize = _main.PaintDef.SmallFont.Size + (_main.PaintDef.UserFont.Size - _main.PaintDef.SmallFont.Size) * _factor;
        //             font = new Font(_main.PaintDef.UserFont.FontFamily, fntSize, _main.PaintDef.UserFont.Style);
        //             size = _main.PaintDef.Gfx.MeasureString(i.ToString(), font);
        //             col = new SolidBrush(Color.FromArgb((int)(255 - _factor * 255), Color.Blue));
        col = new SolidBrush(_colFontCandidateDel);// new SolidBrush(Color.FromArgb(255, (int)(_factor * 255), 0, (int)(255 - _factor * 255)));
        col = new SolidBrush(Blend(Color.Black, _colFontCandidateDel, _factor));// new SolidBrush(Color.FromArgb(255, (int)(_factor * 255), 0, (int)(255 - _factor * 255)));
      }
      break;
  }
  _main.PaintDef.Gfx.DrawString(i.ToString(), font, col, x - size.Width / 2, y - size.Height / 2);
}

private void PaintBackground(AnimDef anim, Brush col, int x, int y)
{
  col = new SolidBrush(Color.FromArgb(255, 255, 255, 255));
  _main.PaintDef.Gfx.FillRectangle(col, new Rectangle(x, y, _main.PaintDef.FldWid, _main.PaintDef.FldHig));
  switch (anim.BackType)
  {
    case eAnimBack.MarkRow:
      _main.PaintDef.Gfx.DrawLine(new Pen(_colMarkArea, 4), x, y + _main.PaintDef.FldHig / 2, x + _main.PaintDef.FldWid, y + _main.PaintDef.FldHig / 2);
      break;
    case eAnimBack.MarkColumn:
      _main.PaintDef.Gfx.DrawLine(new Pen(_colMarkArea, 4), x + _main.PaintDef.FldWid / 2, y, x + _main.PaintDef.FldWid / 2, y + _main.PaintDef.FldHig);
      break;
    case eAnimBack.MarkArea:
      col = new SolidBrush(_colMarkArea);
      _main.PaintDef.Gfx.FillRectangle(col, new Rectangle(x, y, _main.PaintDef.FldWid, _main.PaintDef.FldHig));
      break;
    case eAnimBack.MarkField:
      col = new SolidBrush(Color.FromArgb(255, 255, 255, 150));
      if(SettingsSX.GameMode != eGameMode.Solver)
        col = new SolidBrush(Color.FromArgb(255, 200, 200, 255));
      _main.PaintDef.Gfx.FillRectangle(col, new Rectangle(x, y, _main.PaintDef.FldWid, _main.PaintDef.FldHig));
      break;
  }
}

internal void PaintAnimations()
{
  if (SettingsSX.GameMode != eGameMode.Solver)
  {
    bool hasMark = false;
    foreach (AnimDef anim in _animations)
    {
      FieldDef fld = anim.Field;
      if (fld != null && anim.ForeType == eAnimFore.SetCandidate)
      {
        fld.OnPaintSmall = PaintCandidate;
        fld.OnPaintBack = PaintBackground;
        _xPos = _main.PaintDef.RecBoard.X + 1 + fld.X * (_main.PaintDef.FldWid + 1);
        _yPos = _main.PaintDef.RecBoard.Y + 1 + fld.Y * (_main.PaintDef.FldHig + 1);
        _main.PaintField(_xPos, _yPos, fld, anim);
        hasMark = true;
      }
    }
    if(!hasMark)
      _hint = "Ich kann aufgrund der vorliegenden Informationen keine weitere Zahl ermitteln.";

    _main.Hint = _preHint + Hint;
    _main.PaintHint();
    return;
  }

  foreach (AnimDef anim in _animations)
  {
    FieldDef fld = anim.Field;
    if (fld != null)
    {
      fld.OnPaintSmall = PaintCandidate;
      fld.OnPaintBack = PaintBackground;
      _xPos = _main.PaintDef.RecBoard.X + 1 + fld.X * (_main.PaintDef.FldWid + 1);
      _yPos = _main.PaintDef.RecBoard.Y + 1 + fld.Y * (_main.PaintDef.FldHig + 1);
      _main.PaintField(_xPos, _yPos, fld, anim);
    }
  }

  foreach (AnimDef anim in _animations)
  {
    if(anim.ForeType == eAnimFore.MarkLink)
    {
      Point p1 = new Point();
      Point p2 = new Point();
      int wid = _main.PaintDef.FldWid / _main.PaintDef.SmallLine;
      int hig = _main.PaintDef.FldHig / _main.PaintDef.SmallLine;
      int xd = (int)((((anim.Link.Candidate-1) % _main.PaintDef.SmallLine)+0.5) * wid);
      int yd = (int)((((int)((anim.Link.Candidate-1) / _main.PaintDef.SmallLine))+0.5) * hig);
      p1.X = _main.PaintDef.RecBoard.X + 1 + anim.Link.Fields[0].X * (_main.PaintDef.FldWid + 1) + xd;
      p1.Y = _main.PaintDef.RecBoard.Y + 1 + anim.Link.Fields[0].Y * (_main.PaintDef.FldHig + 1) + yd;
      p2.X = _main.PaintDef.RecBoard.X + 1 + anim.Link.Fields[1].X * (_main.PaintDef.FldWid + 1) + xd;
      p2.Y = _main.PaintDef.RecBoard.Y + 1 + anim.Link.Fields[1].Y * (_main.PaintDef.FldHig + 1) + yd;

      if (p1.X == p2.X)
      {
        Point p3 = new Point(p1.X - _main.PaintDef.FldWid / 2, p1.Y);
        Point p4 = new Point(p2.X - _main.PaintDef.FldWid / 2, p2.Y);
        _main.PaintDef.Gfx.DrawBezier(new Pen(Color.Blue, 2), p1, p3, p4, p2);
      }
      else if (p1.Y == p2.Y)
      {
        Point p3 = new Point(p1.X, p1.Y - _main.PaintDef.FldHig / 2);
        Point p4 = new Point(p2.X, p2.Y - _main.PaintDef.FldHig / 2);
        _main.PaintDef.Gfx.DrawBezier(new Pen(Color.Blue, 2), p1, p3, p4, p2);
      }
      else if (p1.Y < p2.Y)
      {
        Point p3 = new Point(p1.X, p1.Y - _main.PaintDef.FldHig / 2);
        Point p4 = new Point(p2.X - _main.PaintDef.FldWid / 2, p2.Y);
        _main.PaintDef.Gfx.DrawBezier(new Pen(Color.Blue, 2), p1, p3, p4, p2);
      }
      else
      {
        Point p3 = new Point(p1.X - _main.PaintDef.FldWid / 2, p1.Y);
        Point p4 = new Point(p2.X, p2.Y - _main.PaintDef.FldHig / 2);
        _main.PaintDef.Gfx.DrawBezier(new Pen(Color.Blue, 2), p1, p3, p4, p2);
      }

      wid -= 2;
      hig -= 2;
      Rectangle rec = new Rectangle(p1.X - wid / 2, p1.Y - hig / 2, wid, hig);
      PaintLinkedField(anim.Link.Fields[0].GetCandidate(anim.Link.Candidate), anim.Link.Candidate, rec);
      wid -= 2;
      hig -= 2;
      rec = new Rectangle(p2.X - wid / 2, p2.Y - hig / 2, wid, hig);
      PaintLinkedField(anim.Link.Fields[1].GetCandidate(anim.Link.Candidate), anim.Link.Candidate, rec);
    }
  }
  if (Hint != "")
  {
    _main.Hint = _preHint + Hint;
    _main.PaintHint();
  }
}

private void PaintLinkedField(CandidateDef candidate, int value, Rectangle rec)
{
  Brush col = new SolidBrush(Color.Red);
  switch(candidate.Tag)
  {
    case 1:
      _main.PaintDef.Gfx.FillRectangle(new SolidBrush(Color.FromArgb(255, 40, 200, 40)), rec);
      col = new SolidBrush(Color.FromArgb(255, 0, 0, 0));
      break;

    case 2:
      _main.PaintDef.Gfx.FillRectangle(new SolidBrush(Color.FromArgb(255, 40, 40, 200)), rec);
      col = new SolidBrush(Color.FromArgb(255, 255, 255, 255));
      break;

    default:
      _main.PaintDef.Gfx.DrawEllipse(new Pen(Color.Red, 2), rec);
      break;
  }

  _main.PaintDef.Gfx.DrawString(value.ToString(), _main.PaintDef.SmallFont, col, rec.X, rec.Y);
}

internal void DoAnimate(object sender, EventArgs e)
{
  _main.Timer.Stop();
  _active = true;
  if (_factor < 1.0f - _speed)
  _factor += _speed;
else
  _factor = 1.0f;

  if (SettingsSX.GameMode != eGameMode.Solver)
  {
    _factor = 1.0f;
    if (_animations.Find(i => (i.ForeType == eAnimFore.SetCandidate)) != null)
    {
      _hint = "Im markierten Feld kann eine Zahl eingetragen werden.";
    }
    else
    {
    }
  }
  else
  {
    PaintAnimations();
  }

  _main.PaintDef.InvalidBoard = true;
  _main.Invalidate();
  if (_factor < 1)
    _main.Timer.Start();
  else
    StopAnimation();
}

/// #############################################################
/// <summary>
/// Setzt den letzten verbleibenden Kandidaten in das Feld.
/// </summary>
/// #############################################################
protected void SolveNakedSingle()
{
  foreach (FieldDef fld in _paintDef.Fields)
  {
    if (fld.Type != eFieldType.User || fld.Value > 0)
      continue;

    int count = 0;
    int found = 0;
    foreach(CandidateDef candidate in fld.Candidates)
    {
      if (!candidate.Hidden)
      {
        found = candidate.Value;
        count++;
      }
    }
    if (count == 1)
    {
      SetCandidate(fld, eAnimBack.MarkField, found);
      SetSolution(1, String.Format("Die Zahl {0} ist der letzte verbliebene Kandidat im markierten Feld.", found));
      return;
    }
  }
}

#endregion -------------------------------------------------------------------------
}
}
*/
