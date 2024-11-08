import { TestBed } from '@angular/core/testing';

import { RegistrationPageService } from './registration-page.service';

describe('RegistrationPageService', () => {
  let service: RegistrationPageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RegistrationPageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
