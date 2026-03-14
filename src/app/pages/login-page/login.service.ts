import { Injectable } from '@angular/core';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { OrganizationApiService } from 'src/app/services/api-service/organization-api.service';
import { Router } from '@angular/router';
import { CommonService } from 'src/app/shared/services/common.service';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';
import { Subject, takeUntil } from 'rxjs';
import { mapUserToLegacy, mapOrganizationToUserShape } from 'src/app/shared/utils/user-mapper.util';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  constructor(
    private authService: AuthService,
    private organizationApiService: OrganizationApiService,
    private router: Router,
    private commonService: CommonService
  ) {}

  public login(
    _destroy$: Subject<void>,
    loginInfo: { accountType: string; email: string; password: string }
  ) {
    const { accountType, email, password } = loginInfo;
    if (String(accountType || '').toLowerCase() === 'organization') {
      this.organizationLogin(_destroy$, { email, password });
    } else {
      this.userLogin(_destroy$, { email, password });
    }
  }

  private getAppId(): string | null {
    let appId = sessionStorage.getItem('app_id');
    if (!appId) {
      try {
        const app = JSON.parse(sessionStorage.getItem('application') || '{}');
        appId = app?.id || null;
        if (appId) {
          sessionStorage.setItem('app_id', appId);
        }
      } catch {
        appId = null;
      }
    }
    return appId;
  }

  private organizationLogin(_destroy$: Subject<void>, credentials: { email: string; password: string }) {
    const appId = this.getAppId();
    if (!appId) {
      this.commonService.openToaster({
        message: 'Application not loaded. Please refresh the page and try again.',
        messageType: TOASTER_MESSAGE_TYPE.ERROR,
      });
      return;
    }
    this.organizationApiService
      .login(credentials)
      .pipe(takeUntil(_destroy$))
      .subscribe({
        next: (response) => {
          const orgData = response?.data ?? response;
          if (orgData && (orgData.id || orgData.name)) {
            this.authService.setLogin = true;
            this.authService.getAllUsers().then(users => {
              this.commonService.allUsersList = users || [];
            }).catch(() => {});
            this.router.navigate(['/dashboard']);
            this.commonService.loginedUserInfo = mapOrganizationToUserShape(orgData);
            sessionStorage.setItem('login_details', JSON.stringify(this.commonService.loginedUserInfo));
            sessionStorage.setItem('loginType', this.commonService.loginedUserInfo?.role ?? '');
            sessionStorage.setItem('authToken', orgData.jwt || orgData.token || '');
          } else {
            this.loginFailed();
          }
        },
        error: () => {
          this.loginFailed();
        },
      });
  }

  private userLogin(_destroy$: Subject<void>, credentials: { email: string; password: string }) {
    this.authService
      .loginUser(credentials)
      .pipe(takeUntil(_destroy$))
      .subscribe({
        next: (response) => {
          const userExist = response.success == true || response.success == false ? response.data : response;
          if (Object.keys(userExist || {}).length) {
            this.authService.setLogin = true;
            this.router.navigate(['/dashboard']);
            this.commonService.loginedUserInfo = mapUserToLegacy(userExist);
            sessionStorage.setItem('login_details', JSON.stringify(this.commonService.loginedUserInfo));
            sessionStorage.setItem('loginType', this.commonService.loginedUserInfo?.role ?? '');
            sessionStorage.setItem('authToken', userExist.jwt || '');
          } else {
            this.loginFailed();
          }
        },
        error: () => {
          this.loginFailed();
        },
      });
  }
  private loginFailed() {
    this.commonService.openToaster({
      message: 'Please verify login credential',
      messageType: TOASTER_MESSAGE_TYPE.ERROR,
    });
    this.authService.setLogin = false;
  }
}
