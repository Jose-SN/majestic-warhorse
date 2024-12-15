import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError } from 'rxjs';
import { CommonService } from 'src/app/shared/services/common.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApproveTeacherService {
  private _apiUrl: string = environment.majesticWarhorseApi;

  constructor(
    private http: HttpClient,
    private commonService: CommonService
  ) {}
  public approveTeachers(approveTeacher: any) {
    return this.http
      .put<any>(`${this._apiUrl}user/approve-teachers`, approveTeacher)
      .pipe(catchError(this.commonService.handleError));
  }
}
