import { Injectable } from '@angular/core';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { IPassWordUpdate } from './model';
import { CommonService } from 'src/app/shared/services/common.service';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ForgotPasswordService {
  constructor(
    private authService: AuthService,
    private commonService: CommonService,
    private router: Router
  ) {}

  updatePassword(passwordUpdatePayload: IPassWordUpdate) {
    this.authService.updatePassword(passwordUpdatePayload).subscribe({
      next: (passwordUpdated) => {
        if (passwordUpdated) {
          this.commonService
            .openToaster({
              message: passwordUpdated,
              messageType: TOASTER_MESSAGE_TYPE.SUCCESS,
            })
            .afterDismissed()
            .subscribe(() => {
              this.router.navigate([`/login`]);
            });
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
