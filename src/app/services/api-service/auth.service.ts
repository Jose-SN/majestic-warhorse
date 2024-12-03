import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { catchError, lastValueFrom } from 'rxjs';
import { UserLogin, UserModel } from 'src/app/pages/login-page/model/user-model';
import { CommonService } from 'src/app/shared/services/common.service';
import { IPassWordUpdate } from 'src/app/pages/forgot-password/model';
import { Router } from '@angular/router';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isAuthenticated: boolean = false;
  private _apiUrl: string = environment.majesticWarhorseApi;
  constructor(
    private http: HttpClient,
    private router: Router,
    private commonService: CommonService
  ) {
    this.isAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true';
    const loginedInfo = sessionStorage.getItem('login_details');
    if (loginedInfo) {
      this.commonService.loginedUserInfo = JSON.parse(loginedInfo);
    }
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
  updatePassword(updatePassword: IPassWordUpdate) {
    const interceptor: { [key: string]: string } = { responseType: 'text' };
    return this.http
      .post<string>(`${this._apiUrl}user/forgot-password`, updatePassword, interceptor)
      .pipe(catchError(this.commonService.handleError));
  }
  logout(): void {
    this.isAuthenticated = false;
  }
  isLoggedIn(): boolean {
    return this.isAuthenticated;
  }
  logOutApplication() {
    this.isAuthenticated = false;
    this.commonService.allUsersList = [];
    sessionStorage.removeItem('login_details');
    sessionStorage.removeItem('isAuthenticated');
    this.router.navigate(['/login']);
  }
  validateOtp(updatePassword: IPassWordUpdate) {
    const interceptor: { [key: string]: string } = { responseType: 'text' };
    return this.http
      .post<string>(`${this._apiUrl}user/confirm-password`, updatePassword, interceptor)
      .pipe(catchError(this.commonService.handleError));
  }
}
