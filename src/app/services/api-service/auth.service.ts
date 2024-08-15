import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom, Observable, tap } from 'rxjs';
import { UserModel } from 'src/app/pages/login-page/model/user-model';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _apiUrl: string = environment.majesticWarhorseApi;
  constructor(private http: HttpClient) {}

  getAllUsers(): Promise<UserModel[]> {
    return lastValueFrom(this.http.get<UserModel[]>(`${this._apiUrl}user/get`));
  }
}
