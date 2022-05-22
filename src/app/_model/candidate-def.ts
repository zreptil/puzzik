export class CandidateDef {
  public value = 0;
  public hidden = false;
  public tag = 0;

  public constructor(src: number | CandidateDef | null = null) {
    if (src instanceof CandidateDef) {
      this.hidden = src.hidden;
      this.tag = src.tag;
      this.value = src.value;
    } else if (typeof(src) === 'number') {
      this.value = src;
    }
  }

  public toString(): string {
    return `${this.value}`;
  }
}

