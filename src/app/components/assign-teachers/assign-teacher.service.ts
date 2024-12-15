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
      .put<any>(`${this._apiUrl}user/assign-teachers`, assignTeacherPayload)
      .pipe(catchError(this.commonService.handleError));
  }
}
