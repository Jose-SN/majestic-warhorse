import { Injectable, inject } from '@angular/core';
import { IamFacade } from 'src/app/store/iam/iam.facade';

@Injectable({ providedIn: 'root' })
export class AppContextService {
  private readonly iam = inject(IamFacade);

  /** Read cached app id from the IAM store (no network). */
  getAppIdSync(): string | null {
    return this.iam.appId || sessionStorage.getItem('app_id');
  }

  /** Ensure app id is available; loads application/get through the store if needed. */
  ensureAppId(): Promise<string> {
    return this.iam.ensureAppId();
  }
}
