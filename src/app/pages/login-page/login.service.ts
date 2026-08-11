import { Injectable } from '@angular/core';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';
import { Subject, takeUntil } from 'rxjs';
import { PostLoginWorkflowService } from 'src/app/core/auth/post-login-workflow.service';
import { IamFacade } from 'src/app/store/iam/iam.facade';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  constructor(
    private authService: AuthService,
    private iam: IamFacade,
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
    return this.iam.appId || sessionStorage.getItem('app_id');
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
    this.iam
      .loginOrganization(credentials)
      .pipe(takeUntil(_destroy$))
      .subscribe({
        next: async (response) => {
          const orgData = ((response as { data?: Record<string, unknown> })?.data ??
            response) as Record<string, unknown>;
          if (orgData && (orgData['id'] || orgData['name'])) {
            const jwt = String(orgData['jwt'] || orgData['token'] || '');
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
    this.iam
      .loginUser(credentials)
      .pipe(takeUntil(_destroy$))
      .subscribe({
        next: async (response) => {
          const body = response as { success?: boolean; data?: Record<string, unknown> };
          const userExist = (body.success === true || body.success === false
            ? body.data
            : response) as Record<string, unknown> | undefined;
          if (Object.keys(userExist || {}).length) {
            const jwt = String(userExist?.['jwt'] || '');
            const roleIntent = sessionStorage.getItem('pendingRoleIntent') as 'teacher' | 'student' | null;
            await this.postLoginWorkflow.completeLogin({
              jwt,
              loginType: 'user',
              profile: userExist || {},
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
