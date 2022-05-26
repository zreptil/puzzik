import {eAnimBack, eAnimFore, eAnimMark, FieldDef} from './field-def';
import {LinkedCandidates} from './linked-candidates';

export class AnimDef {
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

