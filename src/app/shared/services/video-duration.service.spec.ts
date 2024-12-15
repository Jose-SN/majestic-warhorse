import { TestBed } from '@angular/core/testing';

import { VideoDurationService } from './video-duration.service';

describe('VideoDurationService', () => {
  let service: VideoDurationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VideoDurationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
