import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { interval, Subject, takeUntil, firstValueFrom } from 'rxjs';
import { CommonSearchProfileComponent } from '../../components/common-search-profile/common-search-profile.component';
import { PostLoginWorkflowService } from 'src/app/core/auth/post-login-workflow.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';
import { UserRoleApiService } from 'src/app/services/api-service/user-role-api.service';
import { AssignTeacherService } from 'src/app/components/assign-teachers/assign-teacher.service';

@Component({
  selector: 'app-approval-pending',
  standalone: true,
  imports: [CommonSearchProfileComponent],
  templateUrl: './approval-pending.component.html',
  styleUrl: './approval-pending.component.scss',
})
export class ApprovalPendingComponent implements OnInit, OnDestroy {
  infoMessage: string = '';
  isPolling = false;
  private destroy$ = new Subject<void>();
  private pollIntervalMs = 15000;

  constructor(
    private router: Router,
    private postLoginWorkflow: PostLoginWorkflowService,
    private commonService: CommonService,
    private userRoleApi: UserRoleApiService,
    private assignTeacherService: AssignTeacherService
  ) {}

  async ngOnInit() {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state ?? history.state ?? {};
    this.infoMessage = state['infoMessage'] || '';

    const orgId = sessionStorage.getItem('organization_id') || '';
    if (orgId && !(await this.postLoginWorkflow.hasCourseRoles(orgId))) {
      this.router.navigate(['/org-picker']);
      return;
    }

    if (this.shouldPollForApproval()) {
      this.startApprovalPolling();
    }
  }

  private shouldPollForApproval(): boolean {
    const user = this.commonService.loginedUserInfo;
    return user?.status === 'pending' && !!user?.id;
  }

  private startApprovalPolling(): void {
    this.isPolling = true;
    interval(this.pollIntervalMs)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.checkApprovalStatus();
      });
    this.checkApprovalStatus();
  }

  private async checkApprovalStatus(): Promise<void> {
    const user = this.commonService.loginedUserInfo;
    const orgId = sessionStorage.getItem('organization_id') || user?.organization_id || '';
    const userId = user?.id || '';
    if (!orgId || !userId) return;

    try {
      const overview = await firstValueFrom(this.userRoleApi.getOverview(orgId, userId));
      const roles = overview?.roles ?? [];
      const approved = roles.filter((r) => r.status === 'approved');

      if (!approved.length) return;

      user.status = 'active';
      user.role = approved[0].role_code;
      sessionStorage.setItem('login_details', JSON.stringify(user));
      this.commonService.loginedUserInfo = user;

      if (user.role === 'student') {
        const res: any = await firstValueFrom(
          this.assignTeacherService.getAssignedTeachers(userId, orgId)
        );
        const data = res?.data ?? res;
        const list = Array.isArray(data) ? data : [];
        this.commonService.hasAssignedTeachers = list.length > 0;
        if (!list.length) {
          this.infoMessage =
            'You have been approved but not yet assigned to teachers. Please contact your organization.';
          this.isPolling = false;
          return;
        }
      }

      this.commonService.openToaster({
        message: 'Your account has been approved!',
        messageType: TOASTER_MESSAGE_TYPE.SUCCESS,
      });
      this.router.navigate(['/dashboard']);
    } catch {
      // Keep polling on transient errors
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
