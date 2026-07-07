import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, lastValueFrom, map, Observable } from 'rxjs';
import { ICourseStatus } from 'src/app/pages/course-details/model/course-status';
import { ICourseList, IcourseListResponse } from 'src/app/pages/courses/modal/course-list';
import { CommonService } from 'src/app/shared/services/common.service';
import { environment } from 'src/environments/environment';

export interface CourseListParams {
  populateChapters?: boolean;
  populateFiles?: boolean;
  createdBy?: string;
  organization_id?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CoursesApiService {
  private _apiUrl: string = environment.majesticWarhorseApi;

  constructor(
    private http: HttpClient,
    private commonService: CommonService
  ) {}

  private buildCourseParams(params: CourseListParams = {}): HttpParams {
    let httpParams = new HttpParams();
    if (params.populateChapters !== false) {
      httpParams = httpParams.set('populateChapters', 'true');
    }
    if (params.populateFiles !== false) {
      httpParams = httpParams.set('populateFiles', 'true');
    }
    if (params.createdBy) {
      httpParams = httpParams.set('createdBy', params.createdBy);
    }
    if (params.organization_id) {
      httpParams = httpParams.set('organization_id', params.organization_id);
    }
    return httpParams;
  }

  getCourses(params: CourseListParams = {}): Observable<ICourseList[]> {
    return this.http
      .get<ICourseList[]>(`${this._apiUrl}course/get`, {
        params: this.buildCourseParams(params),
      })
      .pipe(
        map((res) => (Array.isArray(res) ? res : (res as any)?.data ?? [])),
        catchError(this.commonService.handleError)
      );
  }

  getStudentCourses(studentId: string, organizationId: string): Observable<ICourseList[]> {
    const query = organizationId
      ? `?organization_id=${encodeURIComponent(organizationId)}`
      : '';
    return this.http
      .get<ICourseList[]>(`${this._apiUrl}course/student/${studentId}${query}`)
      .pipe(
        map((res) => (Array.isArray(res) ? res : (res as any)?.data ?? [])),
        catchError(this.commonService.handleError)
      );
  }

  geAllDetailsCourseList() {
    return this.getCourses();
  }

  saveCourseDetails(courseUploadPayload: any) {
    return this.http
      .post<any>(`${this._apiUrl}course/save`, courseUploadPayload)
      .pipe(catchError(this.commonService.handleError));
  }

  updateCourseDetails(courseUploadPayload: any) {
    return this.http
      .put<any>(`${this._apiUrl}course/update`, courseUploadPayload)
      .pipe(catchError(this.commonService.handleError));
  }

  fetchUploadedCourses(params: CourseListParams = {}) {
    return lastValueFrom(this.getCourses(params));
  }

  saveCourseStatus(courseUploadPayload: any) {
    return this.http
      .post<ICourseStatus>(`${this._apiUrl}status/save`, courseUploadPayload)
      .pipe(catchError(this.commonService.handleError));
  }

  updateCourseStatus(courseUploadPayload: any) {
    return this.http
      .put<ICourseStatus>(`${this._apiUrl}status/update`, courseUploadPayload)
      .pipe(catchError(this.commonService.handleError));
  }

  getCourseStatusList() {
    return lastValueFrom(
      this.http
        .get<ICourseStatus[]>(`${this._apiUrl}status/get`)
        .pipe(catchError(this.commonService.handleError))
    );
  }
}
