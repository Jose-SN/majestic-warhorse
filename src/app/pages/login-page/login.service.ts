import { Injectable } from '@angular/core';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { UserLogin } from './model/user-model';
import { Router } from '@angular/router';
import { CommonService } from 'src/app/shared/services/common.service';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';
import { Subject, takeUntil } from 'rxjs';
import { mapUserToLegacy } from 'src/app/shared/utils/user-mapper.util';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  constructor(
    private authService: AuthService,
    private router: Router,
    private commonService: CommonService
  ) {}
  public userLogin(_destroy$: Subject<void>, loginInfo: UserLogin) {
    this.authService
      .loginUser(loginInfo)
      .pipe(takeUntil(_destroy$))
      .subscribe({
        next: (userExist) => {
          if (Object.keys(userExist || {}).length) {
            this.authService.setLogin = true;
            this.router.navigate(['/dashboard']);
            // Map new structure to include legacy fields for backward compatibility
            this.commonService.loginedUserInfo = mapUserToLegacy(userExist);
            sessionStorage.setItem(
              'login_details',
              JSON.stringify(this.commonService.loginedUserInfo)
            );
            sessionStorage.setItem('authToken', userExist.jwt || '');
          } else {
            this.loginUserFailed();
          }
        },
        error: () => {
          this.loginUserFailed();
        },
      });
  }
  private loginUserFailed() {
    this.commonService.openToaster({
      message: 'Please verify login credential',
      messageType: TOASTER_MESSAGE_TYPE.ERROR,
    });
    this.authService.setLogin = false;
  }
}
