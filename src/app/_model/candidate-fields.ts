/**
 * Klasse, um eine Liste von Feldern zu verwalten, die bestimmte
 * Kandidaten gemeinsam haben.
 */
import {FieldDef} from './field-def';

export class CandidateFields {
  public collected: number[] = [];

  constructor(public candidate = 0, public fields: FieldDef[] = []) {
  }

  public clear(): void {
    this.candidate = 0;
    this.collected = [];
    this.fields = [];
  }

  public equals(src: CandidateFields): boolean {
    if (src.fields.length != this.fields.length) {
      return false;
    }

    for (let i = 0; i < this.fields.length; i++) {
      if (this.fields[i].x != src.fields[i].x || this.fields[i].y != src.fields[i].y) {
        return false;
      }
    }

    return true;
  }

  public equalsRow(src: CandidateFields): boolean {
    if (src.fields.length != this.fields.length) {
      return false;
    }

    for (let i = 0; i < this.fields.length; i++) {
      if (this.fields[i].y != src.fields[i].y) {
        return false;
      }
    }

    return true;
  }

  public equalsColumn(src: CandidateFields): boolean {
    if (src.fields.length != this.fields.length) {
      return false;
    }

    for (let i = 0; i < this.fields.length; i++) {
      if (this.fields[i].x != src.fields[i].x) {
        return false;
      }
    }

    return true;
  }

  public toString(): string {
    return 'Candidate = ' + this.candidate;
  }
}
