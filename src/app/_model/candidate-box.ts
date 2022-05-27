import {FieldDef} from './field-def';

/**
 *  Containerklasse für Aufnahme von Kandidaten und Feldern, die
 * genau die Kombination von Kandidaten beinhalten.
 */
export class CandidateBox {
  // Kandidaten der enthaltenen Felder.
  public candidates: number[] = [];
  // Liste der Felder mit den Kandidaten.
  public fields: FieldDef[] = [];

  public constructor(fld?: FieldDef) {
    if (fld != null) {
      for (const candidate of fld.candidates) {
        if (!candidate.hidden) {
          this.candidates.push(candidate.value);
        }
      }
      this.fields.push(fld);
    }
  }

  public get clone(): CandidateBox {
    const ret = new CandidateBox();

    for (const fld of this.fields) {
      ret.fields.push(fld);
    }

    for (const candidate of this.candidates) {
      ret.candidates.push(candidate);
    }

    return ret;
  }

  public merge(src: CandidateBox): void {
    for (const fld of src.fields) {
      if (this.fields.find(f => f.equals(fld) == null)) {
        this.fields.push(fld);
      }
    }

    for (const val of src.candidates) {
      if (this.candidates.find(c => +c === +val)) {
        this.candidates.push(val);
      }
    }
  }
}
