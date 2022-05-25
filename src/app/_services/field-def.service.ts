import {Injectable} from '@angular/core';
import {FieldDef} from '../_model/field-def';
import {CandidateDef} from '../_model/candidate-def';
import {ConfigService} from './config.service';

@Injectable({
  providedIn: 'root'
})
export class FieldDefService {

  constructor(public cfg: ConfigService) {
  }

  create(src?: string): FieldDef {
    const ret = FieldDef.create();
    ret.sumRight = 0;
    ret.sumLeft = 0;
    ret.sumDown = 0;
    ret.sumUp = 0;
    ret.candidates = [];
    for (let i = 1; i <= this.cfg.numberCount; i++) {
      ret.candidates.push(new CandidateDef(i));
    }

    if (src != null) {
      const parts = src.split('|');
      ret.x = +parts[0];
      ret.y = +parts[1];
      ret.value = +parts[2];
    }
    return ret;
  }
}
