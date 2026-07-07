import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
import { CourseApiResponse, UserRoleOverview } from 'src/app/models/roster.model';
import { CommonService } from 'src/app/shared/services/common.service';
import { environment } from 'src/environments/environment';

export interface UserRoleSavePayload {
  organization_id: string;
  user_id?: string;
  role_code: 'teacher' | 'student' | 'org_admin';
  status?: string;
  first_name?: string;
  last_name?: string;
  contact?: { email?: string; phone?: string };
}

@Injectable({ providedIn: 'root' })
export class UserRoleApiService {
  private readonly _apiUrl = environment.majesticWarhorseApi;

  constructor(
    private http: HttpClient,
    private commonService: CommonService
  ) {}

  getOverview(organizationId: string, userId: string): Observable<UserRoleOverview | null> {
    const params = new HttpParams()
      .set('organization_id', organizationId)
      .set('user_id', userId);
    return this.http
      .get<CourseApiResponse<UserRoleOverview[]>>(`${this._apiUrl}user-role/get-overview`, { params })
      .pipe(
        map((res) => {
          const data = res?.data ?? [];
          const list = Array.isArray(data) ? data : [data];
          return list.find((o) => o.organization_id === organizationId && o.user_id === userId) ?? list[0] ?? null;
        }),
        catchError(this.commonService.handleError)
      );
  }

  getPermissions(organizationId: string, userId: string): Observable<string[]> {
    const params = new HttpParams()
      .set('organization_id', organizationId)
      .set('user_id', userId);
    return this.http
      .get<CourseApiResponse<{ permissions?: string[] } | string[]>>(`${this._apiUrl}user-role/permissions`, {
        params,
      })
      .pipe(
        map((res) => {
          const data = res?.data;
          if (Array.isArray(data)) return data as string[];
          return (data as { permissions?: string[] })?.permissions ?? [];
        }),
        catchError(this.commonService.handleError)
      );
  }

  saveRole(payload: UserRoleSavePayload): Observable<CourseApiResponse<unknown>> {
    return this.http
      .post<CourseApiResponse<unknown>>(`${this._apiUrl}user-role/save`, payload)
      .pipe(catchError(this.commonService.handleError));
  }
}
