import { TestBed } from '@angular/core/testing';

import { QuestionnaireApiService } from './questionnaire-api.service';

describe('QuestionnaireApiService', () => {
  let service: QuestionnaireApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuestionnaireApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
