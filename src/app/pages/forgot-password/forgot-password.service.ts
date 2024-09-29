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
    this.authService
      .updatePassword(passwordUpdatePayload)
      .pipe(takeUntil(_destroy$))
      .subscribe({
        next: (passwordUpdated) => {
          if (passwordUpdated) {
            this.commonService.openToaster({
              message: passwordUpdated,
              messageType: TOASTER_MESSAGE_TYPE.SUCCESS,
            });
            setTimeout(() => {
              this.router.navigate([`/login`]);
            }, 9000);
          }
        },
        error: () => {
          this.commonService.openToaster({
            message: 'Error while updating password.',
            messageType: TOASTER_MESSAGE_TYPE.ERROR,
          });
        },
      });
  }
}
