import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApplicationApiService } from 'src/app/services/api-service/application-api.service';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class AppContextService {
  private loadPromise: Promise<string | null> | null = null;

  constructor(private applicationApi: ApplicationApiService) {}

  /** Read cached app id from session (no network). */
  getAppIdSync(): string | null {
    const cached = sessionStorage.getItem('app_id');
    if (cached) {
      return cached;
    }

    try {
      const applicationData = sessionStorage.getItem('application');
      if (applicationData) {
        const appData = JSON.parse(applicationData);
        if (appData?.id) {
          sessionStorage.setItem('app_id', appData.id);
          if (appData.client_id) {
            sessionStorage.setItem('client_id', appData.client_id);
          }
          return appData.id as string;
        }
      }
    } catch {
      // ignore parse errors
    }

    return null;
  }

  /** Ensure app id is available; fetches from IAM if not cached. */
  ensureAppId(): Promise<string> {
    const existing = this.getAppIdSync();
    if (existing) {
      return Promise.resolve(existing);
    }

    if (!this.loadPromise) {
      this.loadPromise = this.fetchAndCacheAppId();
    }

    return this.loadPromise.then((appId) => {
      if (!appId) {
        throw new Error('Application not loaded. Please refresh the page and try again.');
      }
      return appId;
    });
  }

  private async fetchAndCacheAppId(): Promise<string | null> {
    try {
      const response: any = await firstValueFrom(this.applicationApi.getApplications());
      const apps = response?.data ?? response ?? [];
      if (!Array.isArray(apps) || apps.length === 0) {
        return null;
      }

      const app =
        apps.find((entry: any) => entry.client_id === environment.client_id) ?? apps[0];

      if (!app?.id) {
        return null;
      }

      sessionStorage.setItem('application', JSON.stringify(app));
      sessionStorage.setItem('app_id', app.id);
      if (app.client_id) {
        sessionStorage.setItem('client_id', app.client_id);
      }

      return app.id as string;
    } catch {
      return null;
    }
  }
}
