import { Injectable } from '@angular/core';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { OrganizationApiService } from 'src/app/services/api-service/organization-api.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';
import { Subject, takeUntil } from 'rxjs';
import { PostLoginWorkflowService } from 'src/app/core/auth/post-login-workflow.service';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  constructor(
    private authService: AuthService,
    private organizationApiService: OrganizationApiService,
    private commonService: CommonService,
    private postLoginWorkflow: PostLoginWorkflowService
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
        next: async (response) => {
          const orgData = response?.data ?? response;
          if (orgData && (orgData.id || orgData.name)) {
            const jwt = orgData.jwt || orgData.token || '';
            await this.postLoginWorkflow.completeLogin({
              jwt,
              loginType: 'organization',
              profile: orgData,
              authProvider: 'password',
            });
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
        next: async (response) => {
          const userExist =
            response.success === true || response.success === false ? response.data : response;
          if (Object.keys(userExist || {}).length) {
            const jwt = userExist.jwt || '';
            const roleIntent = sessionStorage.getItem('pendingRoleIntent') as 'teacher' | 'student' | null;
            await this.postLoginWorkflow.completeLogin({
              jwt,
              loginType: 'user',
              profile: userExist,
              authProvider: 'password',
              roleIntent: roleIntent ?? undefined,
            });
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
