import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AppContextService } from '../app-context.service';

export interface IamUser {
  id?: string;
  first_name?: string;
  last_name?: string;
  contact?: { email?: string; phone?: string };
  organization_id?: string;
  role?: string;
  status?: string;
  app_id?: string;
  profile_image?: string;
  jwt?: string;
  roles?: any[];
  [key: string]: any;
}

export interface UserSyncPayload {
  first_name: string;
  last_name: string;
  profile_image?: string;
  contact: { email: string; phone?: string };
  organization_id?: string;
  role?: string;
  status?: string;
  additional_information?: Record<string, any>;
}

export interface IamResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: any;
}

@Injectable({
  providedIn: 'root',
})
export class UserOAuthService {
  private readonly _apiUrl: string = environment.iamApi;

  constructor(
    private http: HttpClient,
    private appContext: AppContextService
  ) {}

  private buildHeaders(appId: string, json = false): HttpHeaders {
    return new HttpHeaders({
      ...(json ? { 'Content-Type': 'application/json' } : {}),
      'x-app-id': appId,
      app_id: appId,
    });
  }

  /**
   * GET /user/get?email=... — returns the matching IAM user, or null if the
   * user does not exist for this app.
   */
  async getUserByEmail(email: string): Promise<IamUser | null> {
    if (!email) return null;
    try {
      const appId = await this.appContext.ensureAppId();
      const response: any = await firstValueFrom(
        this.http.get<IamResponse<IamUser[]>>(
          `${this._apiUrl}user/get?email=${encodeURIComponent(email)}`,
          { headers: this.buildHeaders(appId) }
        )
      );
      const users: IamUser[] = response?.data ?? response ?? [];
      const list = Array.isArray(users) ? users : [users];
      const match = list.find(
        (u) => (u?.contact?.email ?? (u as any)?.email ?? '').toLowerCase() === email.toLowerCase()
      );
      return match ?? null;
    } catch {
      return null;
    }
  }

  /** POST /user/sync — idempotent find-or-create. Returns the synced user. */
  async syncUser(payload: UserSyncPayload): Promise<IamResponse<IamUser>> {
    const appId = await this.appContext.ensureAppId();
    return firstValueFrom(
      this.http.post<IamResponse<IamUser>>(`${this._apiUrl}user/sync`, payload, {
        headers: this.buildHeaders(appId, true),
      })
    );
  }
}
