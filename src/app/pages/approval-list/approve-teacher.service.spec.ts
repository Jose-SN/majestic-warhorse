import { TestBed } from '@angular/core/testing';

import { ApproveTeacherService } from './approve-teacher.service';

describe('ApproveTeacherService', () => {
  let service: ApproveTeacherService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApproveTeacherService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
