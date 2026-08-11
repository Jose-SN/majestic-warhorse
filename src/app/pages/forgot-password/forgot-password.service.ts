import { Injectable } from '@angular/core';
import { IPassWordUpdate } from './model';
import { CommonService } from 'src/app/shared/services/common.service';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { IamFacade } from 'src/app/store/iam/iam.facade';

@Injectable({
  providedIn: 'root',
})
export class ForgotPasswordService {
  constructor(
    private iam: IamFacade,
    private commonService: CommonService,
    private router: Router
  ) {}

  private getAppId(): string | null {
    return this.iam.appId || sessionStorage.getItem('app_id');
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
        ? this.iam.updateOrganizationPassword(passwordUpdatePayload)
        : this.iam.updateUserPassword(passwordUpdatePayload);
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
        ? this.iam.confirmOrganizationPassword(otpPayload)
        : this.iam.confirmUserPassword(passwordUpdatePayload);
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