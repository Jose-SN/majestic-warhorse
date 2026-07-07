import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, from, map, Observable, switchMap, throwError } from 'rxjs';
import { AppContextService } from 'src/app/core/app-context.service';
import { UserModel } from 'src/app/pages/login-page/model/user-model';
import { CommonService } from 'src/app/shared/services/common.service';
import { environment } from 'src/environments/environment';
import type { Organization, OrganizationCreatePayload, OrganizationResponse } from 'src/app/models/organization.model';

/** @deprecated Use Organization from models/organization.model */
export type IOrganization = Pick<Organization, 'id' | 'name'> & Record<string, unknown>;

export interface OrganizationListParams {
  userId?: string;
  email?: string;
}

@Injectable({
  providedIn: 'root',
})
export class OrganizationApiService {
  private _apiUrl: string = environment.iamApi;

  constructor(
    private http: HttpClient,
    private commonService: CommonService,
    private appContext: AppContextService
  ) {}

  getOrganizations() {
    return this.http
      .get<{ data: Organization[] } | Organization[]>(`${this._apiUrl}organization/get`)
      .pipe(catchError(this.commonService.handleError));
  }

  saveOrganization(payload: OrganizationCreatePayload) {
    return this.http
      .post<OrganizationResponse | Organization>(`${this._apiUrl}organization/save`, payload)
      .pipe(
        map((res: any) => res?.data ?? res),
        catchError(this.commonService.handleError)
      );
  }

  /** @deprecated Use saveOrganization with OrganizationCreatePayload */
  saveUserInfo(registrationInfo: OrganizationCreatePayload) {
    return this.saveOrganization(registrationInfo);
  }

  updatePassword(updatePassword: { email: string; password: string }) {
    const interceptor: { [key: string]: string } = { responseType: 'text' };
    return this.http
      .post<string>(`${this._apiUrl}organization/forgot-password`, updatePassword, interceptor)
      .pipe(catchError(this.commonService.handleError));
  }

  validateOtp(updatePassword: { email: string; otp: string; password: string }) {
    const interceptor: { [key: string]: string } = { responseType: 'text' };
    return this.http
      .post<string>(`${this._apiUrl}organization/confirm-password`, updatePassword, interceptor)
      .pipe(catchError(this.commonService.handleError));
  }

  /** Orgs the authenticated user belongs to (requires Bearer JWT + x-app-id + user_id). */
  listOrganizationsForUser(params: OrganizationListParams = {}) {
    return from(this.appContext.ensureAppId()).pipe(
      switchMap(() => {
        const userContext = this.resolveListUserContext(params);
        if (!userContext.userId) {
          return throwError(
            () => new Error('User id is required to list organizations for the current user.')
          );
        }

        let httpParams = new HttpParams().set('user_id', userContext.userId);
        if (userContext.email) {
          httpParams = httpParams.set('email', userContext.email);
        }

        return this.http.get<{
          data: Array<{ organization: Organization; membership?: Record<string, unknown> }>;
        }>(`${this._apiUrl}organization/get-for-users`, { params: httpParams });
      }),
      catchError(this.commonService.handleError)
    );
  }

  private resolveListUserContext(params: OrganizationListParams): { userId: string; email: string } {
    const sessionUser = this.readUserFromSession();
    const activeUser = this.commonService.loginedUserInfo ?? sessionUser;

    const userId = params.userId ?? activeUser?.id ?? '';
    const email =
      params.email ??
      activeUser?.email ??
      activeUser?.contact?.email ??
      '';

    return { userId, email };
  }

  private readUserFromSession(): UserModel | null {
    try {
      const raw = sessionStorage.getItem('login_details');
      return raw ? (JSON.parse(raw) as UserModel) : null;
    } catch {
      return null;
    }
  }

  /** Login as organization - returns org data with role 'organization' */
  login(credentials: { email: string; password: string }) {
    return this.http
      .post<any>(`${this._apiUrl}organization/login`, credentials)
      .pipe(catchError(this.commonService.handleError));
  }

  /** Update organization profile */
  update(orgInfo: Partial<Organization> & { id: string }) {
    return this.http
      .put<OrganizationResponse | Organization>(`${this._apiUrl}organization/update`, orgInfo)
      .pipe(
        map((res: any) => res?.data ?? res),
        catchError(this.commonService.handleError)
      );
  }
}
