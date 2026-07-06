import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IamResponse } from './user-oauth.service';

export interface IamOrganization {
  id?: string;
  name?: string;
  contact?: { email?: string; phone?: string; website?: string };
  about?: string;
  profile_image?: string;
  app_id?: string;
  jwt?: string;
  [key: string]: any;
}

export interface OrganizationSyncPayload {
  name: string;
  contact: { email: string; phone?: string; website?: string };
  about?: string;
  profile_image?: string;
  additional_information?: Record<string, any>;
}

@Injectable({
  providedIn: 'root',
})
export class OrganizationOAuthService {
  private readonly _apiUrl: string = environment.iamApi;

  constructor(private http: HttpClient) {}

  private getAppId(): string {
    return sessionStorage.getItem('app_id') || '';
  }

  private buildHeaders(json = false): HttpHeaders {
    const appId = this.getAppId();
    return new HttpHeaders({
      ...(json ? { 'Content-Type': 'application/json' } : {}),
      ...(appId ? { 'x-app-id': appId, app_id: appId } : {}),
    });
  }

  /**
   * GET /organization/get?email=... — returns the matching organization, or
   * null if none exists for this app.
   */
  async getOrganizationByEmail(email: string): Promise<IamOrganization | null> {
    if (!email) return null;
    try {
      const response: any = await firstValueFrom(
        this.http.get<IamResponse<IamOrganization | IamOrganization[]>>(
          `${this._apiUrl}organization/get?email=${encodeURIComponent(email)}`,
          { headers: this.buildHeaders() }
        )
      );
      const data = response?.data ?? response ?? null;
      const list: IamOrganization[] = Array.isArray(data) ? data : data ? [data] : [];
      const match = list.find(
        (o) => (o?.contact?.email ?? (o as any)?.email ?? '').toLowerCase() === email.toLowerCase()
      );
      return match ?? list[0] ?? null;
    } catch {
      return null;
    }
  }

  /** POST /organization/sync — idempotent find-or-create. */
  async syncOrganization(payload: OrganizationSyncPayload): Promise<IamResponse<IamOrganization>> {
    return firstValueFrom(
      this.http.post<IamResponse<IamOrganization>>(
        `${this._apiUrl}organization/sync`,
        payload,
        { headers: this.buildHeaders(true) }
      )
    );
  }
}
