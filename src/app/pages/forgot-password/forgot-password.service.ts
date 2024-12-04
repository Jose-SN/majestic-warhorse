import { Injectable } from '@angular/core';
import { AuthService } from 'src/app/services/api-service/auth.service';
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
    private commonService: CommonService,
    private router: Router
  ) {}

  updatePassword(_destroy$: Subject<void>, passwordUpdatePayload: IPassWordUpdate) {
    return new Promise((resolve, reject) => {
    this.authService
      .updatePassword(passwordUpdatePayload)
      .pipe(takeUntil(_destroy$))
      .subscribe({
        next: (response) => {debugger
          if (response) {
            resolve(JSON.parse(response));
          }
        },
        error: (error) => {
          reject({success: false, error: error});
        },
      });
    });
  }
  validateOtp(_destroy$: Subject<void>, passwordUpdatePayload: IPassWordUpdate) {
    return new Promise((resolve, reject) => {
    this.authService
      .validateOtp(passwordUpdatePayload)
      .pipe(takeUntil(_destroy$))
      .subscribe({
        next: (response) => {
          if (response) {
            resolve(response);
          }
        },
        error: (error) => {
          reject(error);
        },
      });
    });
  }
}
