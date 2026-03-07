import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError } from 'rxjs';
import { CommonService } from 'src/app/shared/services/common.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class QuestionnaireApiService {
  private _apiUrl: string = environment.majesticWarhorseApi;

  constructor(
    private http: HttpClient,
    private commonService: CommonService
  ) {}
  geAllQuestions() {
    return this.http
      .get<any[]>(`${this._apiUrl}question/get`)
      .pipe(catchError(this.commonService.handleError));
  }

  createQuestion(questionData: any) {
    return this.http
      .post<any>(`${this._apiUrl}question/save`, questionData)
      .pipe(catchError(this.commonService.handleError));
  }

  submitAnswers(answers: any) {
    return this.http
      .post<any>(`${this._apiUrl}question/submit`, answers)
      .pipe(catchError(this.commonService.handleError));
  }

  /** Get all submitted answers (for teachers/admins) */
  getSubmittedAnswers() {
    return this.http
      .get<any[]>(`${this._apiUrl}question/answers/get`)
      .pipe(catchError(this.commonService.handleError));
  }

  /** Update feedback or corrected answer for a submission (teachers/admins) */
  updateAnswerFeedback(submissionId: string, payload: { feedback?: string; correctedAnswers?: Record<string, unknown> }) {
    return this.http
      .put<any>(`${this._apiUrl}question/answers/${submissionId}/feedback`, payload)
      .pipe(catchError(this.commonService.handleError));
  }
}
