import { Injectable } from '@angular/core';

export enum eGameMode
{
  Normal,
  Solver
}

export enum eAppMode
{
  Game,
  Edit,
  Load,
  Save,
  Animate,
  AnimateAll,
  Import
}

@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {
  public numberCount = 9;
  public devSupport = true;
  public gameMode = eGameMode.Normal;
  public appMode = eAppMode.Game;

  constructor() {
  }
}
