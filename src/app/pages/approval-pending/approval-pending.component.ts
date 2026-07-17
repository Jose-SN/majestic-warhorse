import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { interval, Subject, takeUntil, firstValueFrom } from 'rxjs';
import { PostLoginWorkflowService } from 'src/app/core/auth/post-login-workflow.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';
import { UserRoleApiService } from 'src/app/services/api-service/user-role-api.service';
import { AssignTeacherService } from 'src/app/components/assign-teachers/assign-teacher.service';
import { isActiveStatus, isPendingStatus } from 'src/app/models/user-status.model';

@Component({
  selector: 'app-approval-pending',
  standalone: true,
  imports: [],
  templateUrl: './approval-pending.component.html',
  styleUrl: './approval-pending.component.scss',
})
export class ApprovalPendingComponent implements OnInit, OnDestroy {
  infoMessage = '';
  isPolling = false;
  isRefreshing = false;
  readonly defaultMessage =
    'Please wait for an Administrator to grant access to the Majestic Cyber Academy. You will receive a secure notification once your credentials have been verified and access is authorized.';

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

  get bodyMessage(): string {
    return this.infoMessage || this.defaultMessage;
  }

  get headlineStatus(): string {
    if (this.infoMessage.toLowerCase().includes('suspended')) {
      return 'SUSPENDED';
    }
    if (this.infoMessage.toLowerCase().includes('assigned')) {
      return 'ASSIGNMENT_PENDING';
    }
    return 'PENDING_APPROVAL';
  }

  get ticketId(): string {
    const userId = (this.commonService.loginedUserInfo?.id || '').replace(/-/g, '');
    if (!userId) {
      return 'MC-0000-00X';
    }
    const compact = userId.toUpperCase();
    return `MC-${compact.slice(0, 4)}-${compact.slice(4, 7)}X`;
  }

  get nodeName(): string {
    const orgName = sessionStorage.getItem('organization_name') || '';
    if (orgName) {
      return orgName.toUpperCase().replace(/\s+/g, '_').slice(0, 24);
    }
    return 'SYD_SECURE_GATEWAY';
  }

  get queueStatusLabel(): string {
    if (this.isRefreshing) {
      return 'RE-VERIFYING';
    }
    if (this.isPolling) {
      return 'AWAITING_ADMIN';
    }
    return 'MANUAL_REVIEW';
  }

  get sysLogCode(): string {
    const seed = this.ticketId.replace(/[^A-Z0-9]/g, '');
    return `0x${seed.slice(-3).padStart(3, '0')}`;
  }

  get latencyMs(): number {
    return 12;
  }

  refreshStatus(): void {
    if (this.isRefreshing) {
      return;
    }

    this.isRefreshing = true;
    void this.checkApprovalStatus().finally(() => {
      window.setTimeout(() => {
        this.isRefreshing = false;
      }, 1200);
    });
  }

  private shouldPollForApproval(): boolean {
    const user = this.commonService.loginedUserInfo;
    return isPendingStatus(user?.status) && !!user?.id;
  }

  private startApprovalPolling(): void {
    this.isPolling = true;
    interval(this.pollIntervalMs)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        void this.checkApprovalStatus();
      });
    void this.checkApprovalStatus();
  }

  private async checkApprovalStatus(): Promise<void> {
    const user = this.commonService.loginedUserInfo;
    const orgId = sessionStorage.getItem('organization_id') || user?.organization_id || '';
    const userId = user?.id || '';
    if (!orgId || !userId) {
      return;
    }

    try {
      const overview = await firstValueFrom(this.userRoleApi.getOverview(orgId, userId));
      const roles = overview?.roles ?? [];
      const activeRoles = roles.filter((r) => isActiveStatus(r.status));

      if (!activeRoles.length) {
        return;
      }

      user.status = 'active';
      user.role = activeRoles[0].role_code;
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
