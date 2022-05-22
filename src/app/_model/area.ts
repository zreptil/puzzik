import {eAnimBack, FieldDef} from './field-def';

export class Area {
  constructor(public backType: eAnimBack, public fields: FieldDef[] = []) {
  }
}
