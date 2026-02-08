import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError } from 'rxjs';
import { CommonService } from 'src/app/shared/services/common.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AssignTeacherService {
  private _apiUrl: string = environment.iamApi;

  constructor(
    private http: HttpClient,
    private commonService: CommonService
  ) {}
  public assignTeachersToStudent(assignTeacherPayload: any) {
    return this.http
      .post<any>(`${this._apiUrl}teacher-students/assign-teachers`, assignTeacherPayload)
      .pipe(catchError(this.commonService.handleError));
  }

  public getAssignedTeachers(studentId: string) {
    return this.http
      .get<any>(`${this._apiUrl}teacher-students/assigned-teachers/${studentId}`)
      .pipe(catchError(this.commonService.handleError));
  }
}
