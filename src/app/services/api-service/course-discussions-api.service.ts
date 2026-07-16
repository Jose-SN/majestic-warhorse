import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import {
  CourseDiscussionCreatePayload,
  CourseDiscussionRecord,
} from 'src/app/pages/course-details/model/course-discussion.model';
import { CommonService } from 'src/app/shared/services/common.service';
import { environment } from 'src/environments/environment';

export interface CourseDiscussionsQuery {
  course_id: string;
  chapter_id?: string;
  organization_id?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CourseDiscussionsApiService {
  private readonly _apiUrl = environment.majesticWarhorseApi;

  constructor(
    private http: HttpClient,
    private commonService: CommonService
  ) {}

  getDiscussions(query: CourseDiscussionsQuery): Observable<CourseDiscussionRecord[]> {
    let params = new HttpParams().set('course_id', query.course_id);
    if (query.chapter_id) {
      params = params.set('chapter_id', query.chapter_id);
    }
    if (query.organization_id) {
      params = params.set('organization_id', query.organization_id);
    }

    return this.http
      .get<CourseDiscussionRecord[] | { data: CourseDiscussionRecord[] }>(
        `${this._apiUrl}discussion/get`,
        { params }
      )
      .pipe(
        map((res) => {
          const data = Array.isArray(res) ? res : (res?.data ?? []);
          return Array.isArray(data) ? data : [];
        }),
        catchError(() => of([]))
      );
  }

  saveDiscussion(payload: CourseDiscussionCreatePayload): Observable<CourseDiscussionRecord | null> {
    return this.http
      .post<CourseDiscussionRecord | { data: CourseDiscussionRecord }>(
        `${this._apiUrl}discussion/save`,
        payload
      )
      .pipe(
        map((res) => {
          if (res && typeof res === 'object' && 'data' in res) {
            return (res as { data: CourseDiscussionRecord }).data ?? null;
          }
          return (res as CourseDiscussionRecord) ?? null;
        }),
        catchError(this.commonService.handleError)
      );
  }
}
