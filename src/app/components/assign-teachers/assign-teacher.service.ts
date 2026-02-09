import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError } from 'rxjs';
import { CommonService } from 'src/app/shared/services/common.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AssignTeacherService {
  private _apiUrl: string = environment.majesticWarhorseApi;

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
      .get<any>(`${this._apiUrl}teacher-students/student/${studentId}/teachers`)
      .pipe(catchError(this.commonService.handleError));
  }

  public getAssignedStudents(teacherId: string) {
    return this.http
      .get<any>(`${this._apiUrl}teacher-students/teacher/${teacherId}/students`)
      .pipe(catchError(this.commonService.handleError));
  }

  public getAllTeacherStudentRelationships() {
    return this.http
      .get<any>(`${this._apiUrl}teacher-students/get`)
      .pipe(catchError(this.commonService.handleError));
  }
}
