import { TestBed } from '@angular/core/testing';

import { AssignTeacherService } from './assign-teacher.service';

describe('AssignTeacherService', () => {
  let service: AssignTeacherService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AssignTeacherService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
