import { TestBed } from '@angular/core/testing';

import { FileDownloadApiService } from './file-download-api.service';

describe('FileDownloadApiService', () => {
  let service: FileDownloadApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileDownloadApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
