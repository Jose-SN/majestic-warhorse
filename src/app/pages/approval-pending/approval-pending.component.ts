import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { interval, Subject, takeUntil, firstValueFrom } from 'rxjs';
import { CommonService } from 'src/app/shared/services/common.service';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';
import { UserRoleApiService } from 'src/app/services/api-service/user-role-api.service';

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
    private commonService: CommonService,
    private userRoleApi: UserRoleApiService
  ) {}

  async ngOnInit() {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state ?? history.state ?? {};
    this.infoMessage = state['infoMessage'] || '';

    // No org selected yet → pick one; otherwise stay here until user roles exist
    const orgId = sessionStorage.getItem('organization_id') || '';
    if (!orgId) {
      this.router.navigate(['/org-picker']);
      return;
    }

    const navigatedAway = await this.checkOverviewAndNavigate();
    if (navigatedAway) {
      return;
    }

    this.startApprovalPolling();
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
    void this.checkOverviewAndNavigate().finally(() => {
      window.setTimeout(() => {
        this.isRefreshing = false;
      }, 1200);
    });
  }

  private startApprovalPolling(): void {
    this.isPolling = true;
    interval(this.pollIntervalMs)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        void this.checkOverviewAndNavigate();
      });
  }

  /**
   * GET /user-role/get-overview — navigate to dashboard when any user role exists.
   * @returns true when navigation away from this page was triggered
   */
  private async checkOverviewAndNavigate(): Promise<boolean> {
    const user = this.commonService.loginedUserInfo;
    const orgId = sessionStorage.getItem('organization_id') || user?.organization_id || '';
    const userId = user?.id || '';
    if (!orgId || !userId) {
      return false;
    }

    try {
      const overview = await firstValueFrom(this.userRoleApi.getOverview(orgId, userId));
      const roles = overview?.roles ?? [];

      // Still waiting for org to assign a role
      if (!roles.length) {
        return false;
      }

      const primary =
        roles.find((r) => r.role_code === 'teacher') ||
        roles.find((r) => r.role_code === 'student') ||
        roles[0];

      user.status = 'active';
      user.role = primary.role_code;
      sessionStorage.setItem('login_details', JSON.stringify(user));
      sessionStorage.setItem('userRoles', JSON.stringify(roles));
      this.commonService.loginedUserInfo = user;

      this.commonService.openToaster({
        message: 'Access granted. Redirecting to your dashboard.',
        messageType: TOASTER_MESSAGE_TYPE.SUCCESS,
      });
      this.isPolling = false;
      await this.router.navigate(['/dashboard']);
      return true;
    } catch {
      return false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
