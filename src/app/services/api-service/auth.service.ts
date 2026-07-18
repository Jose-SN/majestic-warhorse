import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { catchError, lastValueFrom, map, of } from 'rxjs';
import { UserLogin, UserLoginResponse, UserModel } from 'src/app/pages/login-page/model/user-model';
import { CommonService } from 'src/app/shared/services/common.service';
import { IPassWordUpdate } from 'src/app/pages/forgot-password/model';
import { Router } from '@angular/router';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isAuthenticated: boolean = false;
  private _apiUrl: string = environment.iamApi;
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
    return lastValueFrom(
      this.http.get<{ data: UserModel[] }>(`${this._apiUrl}user/get`).pipe(
        map((res) => res.data || res),
        catchError(this.commonService.handleError)
      )
    );
  }

  getUsersByOrganization(organizationId: string): Promise<UserModel[]> {
    const params = organizationId ? { organization_id: organizationId } : undefined;
    return lastValueFrom(
      this.http.get<{ data: UserModel[] }>(`${this._apiUrl}user/get`, { params }).pipe(
        map((res) => {
          const data = (res as { data?: UserModel[] })?.data ?? res;
          return Array.isArray(data) ? data : [];
        }),
        catchError(() => of([]))
      )
    );
  }

  async resolveUsersForOrganization(
    organizationId: string,
    cached: UserModel[] = []
  ): Promise<UserModel[]> {
    if (organizationId) {
      const orgUsers = await this.getUsersByOrganization(organizationId);
      if (orgUsers.length) {
        return orgUsers;
      }
    }

    if (cached.length) {
      return cached;
    }

    try {
      return await this.getAllUsers();
    } catch {
      return cached;
    }
  }

  getUserById(userId: string): Promise<UserModel | null> {
    if (!userId) {
      return Promise.resolve(null);
    }

    return lastValueFrom(
      this.http
        .get<{ data: UserModel[] | UserModel }>(`${this._apiUrl}user/get`, {
          params: { id: userId },
        })
        .pipe(
          map((res) => {
            const data = (res as { data?: UserModel[] | UserModel })?.data ?? res;
            const list = Array.isArray(data) ? data : data ? [data as UserModel] : [];
            return list.find((user) => user?.id === userId) ?? list[0] ?? null;
          }),
          catchError(() => of(null))
        )
    );
  }
  loginUser(loginInfo: UserLogin) {
    return this.http
      .post<any>(`${this._apiUrl}user/login`, loginInfo)//{ success: boolean, data: UserModel }
      .pipe(
        // map((res: any) => res.success ? res.data : res),
        catchError(this.commonService.handleError)
      );
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
    this.commonService.hasAssignedTeachers = null;
    sessionStorage.clear();
    localStorage.clear();
    this.router.navigate(['/login']);
  }
  validateOtp(updatePassword: IPassWordUpdate) {
    const interceptor: { [key: string]: string } = { responseType: 'text' };
    return this.http
      .post<string>(`${this._apiUrl}user/confirm-password`, updatePassword, interceptor)
      .pipe(catchError(this.commonService.handleError));
  }
  public updateUserInfo(userInfo: any) {
    const userId = userInfo.id;
    if (!userId) {
      throw new Error('User ID is required for update');
    }
    return this.http
      .put<{ data: UserLoginResponse } | UserLoginResponse>(`${this._apiUrl}user/update`, userInfo)
      .pipe(
        map((res: any) => res.data || res),
        catchError(this.commonService.handleError)
      );
  }
}