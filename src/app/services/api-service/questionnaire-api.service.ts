import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
import { CommonService } from 'src/app/shared/services/common.service';
import { environment } from 'src/environments/environment';
import { IQuestion, IQuestionCreate } from 'src/app/pages/questionnaire/model/question.model';
import {
  AnswerFeedbackApiResponse,
  AnswerFeedbackHistoryApiResponse,
  AnswerFeedbackHistoryItem,
  AnswerFeedbackPayload,
  AnswerFeedbackResponseData,
} from 'src/app/pages/questionnaire/model/answer-feedback.model';
import {
  AnswerHistoryApiResponse,
  AnswerHistoryItem,
  AnswerSavePayload,
  AnswerUpdatePayload,
} from 'src/app/pages/questionnaire/model/answer.model';

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

  /** Submit assessment answers - payload includes version (starts at 1) */
  submitAnswers(payload: AnswerSavePayload[]) {
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

  /**
   * Get answer history for a student+course (all versions / attempts).
   * GET /answer/history?course_id=&submitted_by=
   */
  getAnswerHistory(courseId: string, submittedBy: string) {
    return this.http
      .get<AnswerHistoryApiResponse>(`${this._apiUrl}answer/history`, {
        params: { course_id: courseId, submitted_by: submittedBy },
      })
      .pipe(
        map((response) => this.asAnswerHistory(response)),
        catchError(this.commonService.handleError)
      );
  }

  /**
   * Publish corporate teacher feedback for a student's submission.
   * PUT /answers/:studentUserId/feedback
   */
  publishAnswerFeedback(studentUserId: string, payload: AnswerFeedbackPayload) {
    return this.http
      .put<AnswerFeedbackApiResponse>(
        `${this._apiUrl}answers/${encodeURIComponent(studentUserId)}/feedback`,
        payload
      )
      .pipe(catchError(this.commonService.handleError));
  }

  /**
   * Get latest published feedback for a student+course.
   * GET /answers/:studentUserId/feedback?course_id=
   */
  getAnswerFeedback(studentUserId: string, courseId: string) {
    return this.http
      .get<AnswerFeedbackApiResponse>(
        `${this._apiUrl}answers/${encodeURIComponent(studentUserId)}/feedback`,
        { params: { course_id: courseId } }
      )
      .pipe(
        map((response) => (response?.data ?? null) as AnswerFeedbackResponseData | null),
        catchError(this.commonService.handleError)
      );
  }

  /**
   * Get feedback history for a student+course (newest first when backend sorts).
   * GET /answers/:studentUserId/feedback/history?course_id=
   */
  getAnswerFeedbackHistory(studentUserId: string, courseId: string) {
    return this.http
      .get<AnswerFeedbackHistoryApiResponse>(
        `${this._apiUrl}answers/${encodeURIComponent(studentUserId)}/feedback/history`,
        { params: { course_id: courseId } }
      )
      .pipe(
        map((response) => this.asFeedbackHistory(response)),
        catchError(this.commonService.handleError)
      );
  }

  /** Update existing answer row(s) — used for student retry; bumps version */
  updateAnswers(payload: AnswerUpdatePayload[]) {
    return this.http
      .put<any>(`${this._apiUrl}answer/update`, payload)
      .pipe(catchError(this.commonService.handleError));
  }

  private asAnswerHistory(response: AnswerHistoryApiResponse | unknown): AnswerHistoryItem[] {
    if (Array.isArray(response)) {
      return response as AnswerHistoryItem[];
    }
    if (!response || typeof response !== 'object') {
      return [];
    }
    const data = (response as AnswerHistoryApiResponse).data as unknown;
    if (Array.isArray(data)) {
      return data as AnswerHistoryItem[];
    }
    if (data && typeof data === 'object') {
      const bag = data as {
        items?: AnswerHistoryItem[];
        history?: AnswerHistoryItem[];
        attempts?: Array<{
          version?: number;
          submitted_at?: string;
          submittedAt?: string;
          answers?: AnswerHistoryItem[];
        }>;
      };
      if (Array.isArray(bag.items)) return bag.items;
      if (Array.isArray(bag.history)) return bag.history;
      if (Array.isArray(bag.attempts)) {
        const flat: AnswerHistoryItem[] = [];
        bag.attempts.forEach((attempt) => {
          const version = attempt.version;
          const submittedAt = attempt.submitted_at || attempt.submittedAt;
          (attempt.answers || []).forEach((row) => {
            flat.push({
              ...row,
              version: row.version ?? version,
              submitted_at: row.submitted_at || submittedAt,
            });
          });
        });
        return flat;
      }
    }
    return [];
  }

  private asFeedbackHistory(response: AnswerFeedbackHistoryApiResponse | unknown): AnswerFeedbackHistoryItem[] {
    if (Array.isArray(response)) {
      return response as AnswerFeedbackHistoryItem[];
    }
    if (!response || typeof response !== 'object') {
      return [];
    }
    const data = (response as AnswerFeedbackHistoryApiResponse).data as unknown;
    if (Array.isArray(data)) {
      return data as AnswerFeedbackHistoryItem[];
    }
    if (data && typeof data === 'object') {
      const bag = data as {
        items?: AnswerFeedbackHistoryItem[];
        history?: AnswerFeedbackHistoryItem[];
        review?: unknown;
        id?: string;
        feedback_id?: string;
      };
      if (Array.isArray(bag.items)) return bag.items;
      if (Array.isArray(bag.history)) return bag.history;
      // Some responses return the latest feedback object instead of an array
      if (bag.review || bag.id || bag.feedback_id) {
        return [bag as AnswerFeedbackHistoryItem];
      }
    }
    return [];
  }
}
