import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
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

  private asList<T>(response: unknown): T[] {
    if (Array.isArray(response)) {
      return response as T[];
    }
    const data = (response as { data?: unknown } | null)?.data;
    return Array.isArray(data) ? (data as T[]) : [];
  }

  /** Get all questions (optionally filtered by course) */
  geAllQuestions(courseId?: string): Observable<IQuestion[]> {
    const params: Record<string, string> = {};
    if (courseId) params['course_id'] = courseId;
    return this.http
      .get<unknown>(`${this._apiUrl}question/get`, { params })
      .pipe(
        map((response) => this.asList<IQuestion>(response)),
        catchError(this.commonService.handleError)
      );
  }

  /** Get questions by course ID */
  getQuestionsByCourse(courseId: string): Observable<IQuestion[]> {
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

  /** Submit assessment answers - payload: { course_id, question_id, answer, submitted_by } per answer */
  submitAnswers(payload: Array<{ course_id: string; question_id: string; answer: string; submitted_by: string }>) {
    return this.http
      .post<any>(`${this._apiUrl}answer/save`, payload)
      .pipe(catchError(this.commonService.handleError));
  }

  /** Get all submitted answers (for teachers/admins) */
  getSubmittedAnswers() {
    return this.http
      .get<unknown>(`${this._apiUrl}answer/get`)
      .pipe(
        map((response) => this.asList<any>(response)),
        catchError(this.commonService.handleError)
      );
  }

  /** Get student's submitted answers for a course (pass submittedBy for single user) */
  getStudentAnswersByCourse(courseId: string, submittedBy: string) {
    const params = { course_id: courseId, submitted_by: submittedBy };
    return this.http
      .get<unknown>(`${this._apiUrl}answer/get`, { params })
      .pipe(
        map((response) => this.asList<any>(response)),
        catchError(this.commonService.handleError)
      );
  }

  /** Get all submitted answers for a course (teachers - all students when submittedBy omitted) */
  getAnswersByCourse(courseId: string, submittedBy?: string) {
    const params: Record<string, string> = { course_id: courseId };
    if (submittedBy?.trim()) params['submitted_by'] = submittedBy.trim();
    return this.http
      .get<unknown>(`${this._apiUrl}answer/get`, { params })
      .pipe(
        map((response) => this.asList<any>(response)),
        catchError(this.commonService.handleError)
      );
  }

  /** Update feedback or corrected answer for a submission (teachers/admins) */
  updateAnswerFeedback(submissionId: string, payload: { feedback?: string; correctedAnswers?: Record<string, unknown> }) {
    return this.http
      .put<any>(`${this._apiUrl}question/answers/${submissionId}/feedback`, payload)
      .pipe(catchError(this.commonService.handleError));
  }
}
