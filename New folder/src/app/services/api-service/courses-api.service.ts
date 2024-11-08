import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError } from 'rxjs';
import { IcourseListResponse } from 'src/app/pages/courses/modal/course-list';
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
  getCourseList() {
    return this.http
      .get<IcourseListResponse>(`${this._apiUrl}course/get`)
      .pipe(catchError(this.commonService.handleError));
  }
}
