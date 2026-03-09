import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError } from 'rxjs';
import { CommonService } from 'src/app/shared/services/common.service';
import { environment } from 'src/environments/environment';
import { IQuestion, IQuestionCreate } from 'src/app/pages/questionnaire/model/question.model';

@Injectable({
  providedIn: 'root',
})
export class QuestionnaireApiService {
  private _apiUrl: string = environment.majesticWarhorseApi;

  constructor(
    private http: HttpClient,
    private commonService: CommonService
  ) {}

  /** Get all questions (optionally filtered by course) */
  geAllQuestions(courseId?: string) {
    const params: Record<string, string> = {};
    if (courseId) params['course_id'] = courseId;
    return this.http
      .get<IQuestion[]>(`${this._apiUrl}question/get`, { params })
      .pipe(catchError(this.commonService.handleError));
  }

  /** Get questions by course ID */
  getQuestionsByCourse(courseId: string) {
    return this.geAllQuestions(courseId);
  }

  createQuestion(questionData: IQuestionCreate) {
    return this.http
      .post<IQuestion>(`${this._apiUrl}question/save`, questionData)
      .pipe(catchError(this.commonService.handleError));
  }

  /** Update an existing question */
  updateQuestion(questionId: string, questionData: Partial<IQuestionCreate>) {
    return this.http
      .put<IQuestion>(`${this._apiUrl}question/update/${questionId}`, questionData)
      .pipe(catchError(this.commonService.handleError));
  }

  /** Delete a question */
  deleteQuestion(questionId: string) {
    return this.http
      .delete<any>(`${this._apiUrl}question/delete/${questionId}`)
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
