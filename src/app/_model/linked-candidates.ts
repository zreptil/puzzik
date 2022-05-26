import {FieldDef} from './field-def';
import {Area} from './area';

/**
 * Klasse, um eine Liste von Feldern zu verwalten, die einen
 * bestimmten Kandidaten beinhalten und jeweil die einzigen
 * Felder in einer Einheit sind, die diesen Kandidaten
 * beinhalten.
 */
export class LinkedCandidates {
  public fields: FieldDef[] = [];

  public constructor(public area: Area, public candidate: number) {
  }
}

