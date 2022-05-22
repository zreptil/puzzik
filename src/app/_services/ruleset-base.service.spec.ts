import { TestBed } from '@angular/core/testing';

import { RulesetBaseService } from './ruleset-base.service';

describe('RulesetBaseService', () => {
  let service: RulesetBaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RulesetBaseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
