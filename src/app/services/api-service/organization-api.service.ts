import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map } from 'rxjs';
import { CommonService } from 'src/app/shared/services/common.service';
import { environment } from 'src/environments/environment';
import type { Organization, OrganizationCreatePayload, OrganizationResponse } from 'src/app/models/organization.model';

/** @deprecated Use Organization from models/organization.model */
export type IOrganization = Pick<Organization, 'id' | 'name'> & Record<string, unknown>;

@Injectable({
  providedIn: 'root',
})
export class OrganizationApiService {
  private _apiUrl: string = environment.iamApi;

  constructor(
    private http: HttpClient,
    private commonService: CommonService
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
