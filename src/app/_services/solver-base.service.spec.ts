import { TestBed } from '@angular/core/testing';

import { SolverBaseService } from './solver-base.service';

describe('SolverBaseService', () => {
  let service: SolverBaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SolverBaseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
