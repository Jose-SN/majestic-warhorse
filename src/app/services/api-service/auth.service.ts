import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { catchError, lastValueFrom } from 'rxjs';
import { UserLogin, UserModel } from 'src/app/pages/login-page/model/user-model';
import { CommonService } from 'src/app/shared/services/common.service';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isAuthenticated: boolean = false;
  private _apiUrl: string = environment.majesticWarhorseApi;
  constructor(
    private http: HttpClient,
    private commonService: CommonService
  ) {
    this.isAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true';
  }

  set setLogin(isLoggedIn: boolean) {
    sessionStorage.setItem('isAuthenticated', '' + isLoggedIn); // Store login state
    this.isAuthenticated = isLoggedIn;
  }
  getAllUsers(): Promise<UserModel[]> {
    return lastValueFrom(this.http.get<UserModel[]>(`${this._apiUrl}user/get`));
  }
  loginUser(loginInfo: UserLogin) {
    return this.http
      .post<UserModel>(`${this._apiUrl}user/validate`, loginInfo)
      .pipe(catchError(this.commonService.handleError));
  }
  logout(): void {
    this.isAuthenticated = false;
  }
  isLoggedIn(): boolean {
    return this.isAuthenticated;
  }
}
