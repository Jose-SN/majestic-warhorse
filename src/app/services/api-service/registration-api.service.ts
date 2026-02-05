import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map } from 'rxjs';
import { UserLoginResponse } from 'src/app/pages/login-page/model/user-model';
import { IRegistrationModel } from 'src/app/pages/registration-page/model/registration-model';
import { CommonService } from 'src/app/shared/services/common.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RegistrationApiService {
  private _apiUrl: string = environment.iamApi;

  constructor(
    private http: HttpClient,
    private commonService: CommonService
  ) {}
  public saveUserInfo(registrationInfo: IRegistrationModel) {
    return this.http
      .post<{ data: UserLoginResponse } | UserLoginResponse>(`${this._apiUrl}user/save`, registrationInfo)
      .pipe(
        map((res: any) => res.data || res),
        catchError(this.commonService.handleError)
      );
  }
}
