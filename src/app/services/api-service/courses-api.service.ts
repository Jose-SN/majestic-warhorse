import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, lastValueFrom } from 'rxjs';
import { ICourseStatus } from 'src/app/pages/course-details/model/course-status';
import { ICourseList, IcourseListResponse } from 'src/app/pages/courses/modal/course-list';
import { CommonService } from 'src/app/shared/services/common.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CoursesApiService {
  private _apiUrl: string = environment.majesticWarhorseApi;

  constructor(
    private http: HttpClient,
    private commonService: CommonService
  ) {}
  geAllDetailsCourseList() {
    return this.http
      .get<IcourseListResponse>(
        `${this._apiUrl}course/get?populateUser=true&populateChapters=true&populateFiles=true`
      )
      .pipe(catchError(this.commonService.handleError));
  }
  saveCourseDetails(courseUploadPayload: any) {
    return this.http
      .post<any>(`${this._apiUrl}course/save`, courseUploadPayload)
      .pipe(catchError(this.commonService.handleError));
  }
  fetchUploadedCourses() {
    return lastValueFrom(
      this.http
        .get<
          ICourseList[]
        >(`${this._apiUrl}course/get?populateUser=true&populateChapters=true&populateFiles=true`)
        .pipe(catchError(this.commonService.handleError))
    );
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
