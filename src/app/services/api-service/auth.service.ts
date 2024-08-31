import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { UserModel } from 'src/app/pages/login-page/model/user-model';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isAuthenticated: boolean = false;
  private _apiUrl: string = environment.majesticWarhorseApi;
  constructor(private http: HttpClient) {
    this.isAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true';
  }

  set setLogin(isLoggedIn: boolean) {
    sessionStorage.setItem('isAuthenticated', '' + isLoggedIn); // Store login state
    this.isAuthenticated = isLoggedIn;
  }
  getAllUsers(): Promise<UserModel[]> {
    return lastValueFrom(this.http.get<UserModel[]>(`${this._apiUrl}user/get`));
  }
  logout(): void {
    this.isAuthenticated = false;
  }
  isLoggedIn(): boolean {
    return this.isAuthenticated;
  }
}
