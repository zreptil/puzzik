import { TestBed } from '@angular/core/testing';

import { FieldDefService } from './field-def.service';

describe('FieldDefService', () => {
  let service: FieldDefService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FieldDefService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
