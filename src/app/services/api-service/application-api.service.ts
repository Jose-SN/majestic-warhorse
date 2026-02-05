import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError } from 'rxjs';
import { CommonService } from 'src/app/shared/services/common.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApplicationApiService {
  private _apiUrl: string = environment.iamApi;

  constructor(
    private http: HttpClient,
    private commonService: CommonService
  ) {}

  getApplications() {
    return this.http
      .get<any>(`${this._apiUrl}application/get`)
      .pipe(catchError(this.commonService.handleError));
  }
}
