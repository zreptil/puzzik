import {FieldDef} from './field-def';

export class FieldLink extends FieldDef {
  public linked: FieldLink[] = [];
  public painted: boolean;

  public constructor(private src: FieldDef, public candidate: number, public parent: FieldLink) {
    super();
    this.copyFrom(src);
    this.x = src.x;
    this.y = src.y;
    this.painted = false;
  }

  public get field(): FieldDef {
    return this.src;
  }

  public collectFields(ret: FieldLink[]): void {
    for (const fld of this.linked) {
      ret.push(fld);
      fld.collectFields(ret);
    }
  }

  public setTag(value: number): void {
    this.src.getCandidate(this.candidate).tag = value;
    for (const fld of this.linked) {
      fld.setTag(3 - value);
    }
  }

  public override toString(): string {
    let ret = `[${this.candidate}] ${super.toString()}(`;

    for (const fld of this.linked) {
      ret += ` - ${fld.getString()}`;
    }

    ret += ') ';

    if (ret.endsWith('()')) {
      ret = ret.substring(0, ret.length - 2);
    }

    return ret;
  }

  /**
   * Gibt das Feld zurück, welches dem übergebenen Feld
   * entspricht. Entweder das Feld selbst oder das Feld aus der
   * Liste.
   * @param fld Das zu überprüfende Feld.
   * @returns Das gefundene Feld oder null, wenn nicht gefunden.
   */
  public findField(fld: FieldDef): FieldLink | null {
    if (this.x === fld.x && this.y === fld.y) {
      return this;
    }

    for (const check of this.linked) {
      const ret = check.findField(fld);
      if (ret != null) {
        return ret;
      }
    }

    return null;
  }

  private getString(): string {
    let ret = `${super.toString()}(`;
    for (const fld of this.linked) {
      ret += ` - ${fld.getString()}`;
    }
    ret += ')';

    if (ret.endsWith('()')) {
      ret = ret.substring(0, ret.length - 2);
    }

    return ret;
  }
}

