import { TestBed } from '@angular/core/testing';

import { CourseUploadService } from './course-upload.service';

describe('CourseUploadService', () => {
  let service: CourseUploadService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CourseUploadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
