import {eAnimBack, FieldDef} from './field-def';

export class Area {
  constructor(public backType: eAnimBack, public fields: FieldDef[] = []) {
  }

  public equals(area: Area): boolean {
    let ret = this.backType === area.backType;
    ret &&= this.fields.length === area.fields.length;
    for (const fld of this.fields) {
      if (area.fields.find(f => f.equals(fld)) == null) {
        ret = false;
      }
    }
    return ret;
  }
}
