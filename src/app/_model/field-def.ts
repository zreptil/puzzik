import {CandidateDef} from './candidate-def';
import {Area} from './area';

export enum eAnimBack {
  None,
  MarkField,
  MarkTargetField,
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

export enum eFieldType {
  User,
  Block,
  BlockNumber,
  Preset,
  Control,
  CurrentControl,
  New,
  MAX
}

export enum eSumDir {
  Right,
  Down,
  Left,
  Up
}

export class FieldDef {
  public solution: number = 0;
  public value: number = 0;
  public sumRight: number = 0;
  public sumDown: number = 0;
  public sumLeft: number = 0;
  public sumUp: number = 0;
  public type: eFieldType = eFieldType.Preset;
  public x: number = 0;
  public y: number = 0;
  public isValid = true;
  public candidates: CandidateDef[] = [];
  public areas: Area[] = [];

  protected constructor() {
  }

  public get clone(): FieldDef {
    const ret = new FieldDef();
    ret.solution = this.solution;
    ret.sumRight = this.sumRight;
    ret.sumDown = this.sumDown;
    ret.sumLeft = this.sumLeft;
    ret.sumUp = this.sumUp;
    ret.type = this.type;
    ret.x = this.x;
    ret.y = this.y;
    ret.isValid = this.isValid;

    ret.copyFrom(this);
    return ret;
  }

  public get isBlock(): boolean {
    return this.type === eFieldType.Block || this.type === eFieldType.BlockNumber;
  }

  public get col(): String {
    return String.fromCharCode('A'.charCodeAt(0) + this.x);
  }

  public get row(): string {
    return (this.y + 1).toString();
  }

  public get hasSum(): boolean {
    return this.sumRight != 0 || this.sumLeft != 0 || this.sumUp != 0 || this.sumDown != 0;
  }

  public get hiddenValue(): number {
    let ret = 0;
    let check = 1;
    for (const candidate of this.candidates) {
      if (candidate.hidden) {
        ret |= check;
      }
      check <<= 1;
    }
    return ret;
  }

  public set hiddenValue(value: number) {
    let check = 1;
    for (const candidate of this.candidates) {
      candidate.hidden = (value & check) === check;
      check <<= 1;
    }
  }

  public get hiddenString(): string {
    let ret = '';
    let hidden = 0;

    let check = 1;
    for (const candidate of this.candidates) {
      if (candidate.hidden) {
        hidden |= check;
      }
      check <<= 1;
    }

    ret += hidden.toString(16).padStart(4, '0');
    return ret;
  }

  public get candidateString(): string {
    let ret = '';
    let hidden = 0;

    let check = 1;
    for (const candidate of this.candidates) {
      if (!candidate.hidden) {
        hidden |= check;
      }
      check <<= 1;
    }

    ret += hidden.toString(16).padStart(4, '0');
    return ret;
  }

  public static create(): FieldDef {
    return new FieldDef();
  }

  public copyFrom(fld: FieldDef) {
    this.value = fld.value;
    this.type = fld.type;
    this.candidates = [];
    for (const candidate of fld.candidates) {
      this.candidates.push(new CandidateDef(candidate));
    }
  }

  public clearHidden(): void {
    for (const candidate of this.candidates) {
      if (candidate.value === this.value || this.value <= 0) {
        candidate.hidden = false;
      } else {
        candidate.hidden = true;
      }
    }
  }

  public sum(dir: eSumDir): number {
    switch (dir) {
      case eSumDir.Left:
        return this.sumLeft;
      case eSumDir.Right:
        return this.sumRight;
      case eSumDir.Down:
        return this.sumDown;
      case eSumDir.Up:
        return this.sumUp;
    }

    return 0;
  }

  public getCandidate(value: number): CandidateDef {
    const ret = this.candidates.find(i => +i.value === +value);
    if (ret == null) {
      return new CandidateDef();
    }

    return ret;
  }

  public equals(fld: FieldDef): boolean {
    return +fld.x === +this.x && +fld.y === +this.y;
  }

  public isChanged(fld: FieldDef): boolean {
    if (fld.value != this.value) {
      return true;
    }
    for (let i = 0; i < this.candidates.length; i++) {
      if (this.candidates[i].hidden != fld.candidates[i].hidden) {
        return true;
      }
    }
    return false;
  }

  public toString(): string {
    let s = '';
    for (const cd of this.candidates) {
      if (!cd.hidden) {
        s += cd.value;
      }
    }
    return `${this.x}/${this.y} - ${this.value} - ${s}`;
  }

  public forLog(): string {
    let s = '';
    for (const cd of this.candidates) {
      if (!cd.hidden) {
        s += `${cd}`;
      }
    }
    return `${this.x}/${this.y} - ${+this.value === -1 ? '0' : this.value} - ${s}`;
  }

  public export(): string {
    return `${this.x}|${this.y}|${this.value}`;
  }

  public getCandidates(): CandidateDef[] {
    const ret: CandidateDef[] = [];
    if (this.value > 0) {
      return ret;
    }

    for (const cd of this.candidates) {
      if (!cd.hidden) {
        ret.push(cd);
      }
    }

    return ret;
  }

  public canSee(fld: FieldDef): boolean {
    for (const a of this.areas) {
      if (a.fields.find(f => f.equals(fld)) != null) {
        return true;
      }
    }

    return false;
  }
}
