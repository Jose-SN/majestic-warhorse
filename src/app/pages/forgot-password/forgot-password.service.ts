import { Injectable } from '@angular/core';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { OrganizationApiService } from 'src/app/services/api-service/organization-api.service';
import { IPassWordUpdate } from './model';
import { CommonService } from 'src/app/shared/services/common.service';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ForgotPasswordService {
  constructor(
    private authService: AuthService,
    private organizationApiService: OrganizationApiService,
    private commonService: CommonService,
    private router: Router
  ) {}

  private getAppId(): string | null {
    let appId = sessionStorage.getItem('app_id');
    if (!appId) {
      try {
        const app = JSON.parse(sessionStorage.getItem('application') || '{}');
        appId = app?.id || null;
      } catch {
        appId = null;
      }
    }
    return appId;
  }

  updatePassword(_destroy$: Subject<void>, passwordUpdatePayload: IPassWordUpdate, accountType: string = 'user') {
    return new Promise((resolve, reject) => {
      if (accountType === 'organization' && !this.getAppId()) {
        this.commonService.openToaster({
          message: 'Application not loaded. Please refresh the page and try again.',
          messageType: TOASTER_MESSAGE_TYPE.ERROR,
        });
        reject({ success: false, error: 'app_id required' });
        return;
      }
      const apiCall = accountType === 'organization'
        ? this.organizationApiService.updatePassword(passwordUpdatePayload)
        : this.authService.updatePassword(passwordUpdatePayload);
      apiCall
        .pipe(takeUntil(_destroy$))
        .subscribe({
          next: (response) => {
            if (response) {
              resolve(JSON.parse(response as string));
            }
          },
          error: (error) => {
            reject({success: false, error: error});
          },
        });
    });
  }
  validateOtp(_destroy$: Subject<void>, passwordUpdatePayload: IPassWordUpdate, accountType: string = 'user') {
    return new Promise((resolve, reject) => {
      if (accountType === 'organization' && !this.getAppId()) {
        this.commonService.openToaster({
          message: 'Application not loaded. Please refresh the page and try again.',
          messageType: TOASTER_MESSAGE_TYPE.ERROR,
        });
        reject({ success: false, error: 'app_id required' });
        return;
      }
      const otpPayload = {
        email: passwordUpdatePayload.email,
        otp: passwordUpdatePayload.otp!,
        password: passwordUpdatePayload.password
      };
      const apiCall = accountType === 'organization'
        ? this.organizationApiService.validateOtp(otpPayload)
        : this.authService.validateOtp(passwordUpdatePayload);
      apiCall
        .pipe(takeUntil(_destroy$))
        .subscribe({
          next: (response: unknown) => {
            if (response) {
              resolve(response);
            }
          },
          error: (error: any) => {
            reject(error);
          },
        });
    });
  }
}