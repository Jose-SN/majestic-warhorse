import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  PostLoginWorkflowService,
  RoleIntent,
} from 'src/app/core/auth/post-login-workflow.service';
import { UserOrganizationEntry } from 'src/app/models/organization-picker.model';
import { OrganizationApiService } from 'src/app/services/api-service/organization-api.service';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';
import { decodeText } from 'src/app/shared/utils/utils';

@Component({
  selector: 'app-org-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './org-picker.component.html',
  styleUrl: './org-picker.component.scss',
})
export class OrgPickerComponent implements OnInit {
  organizations: UserOrganizationEntry[] = [];
  loading = true;
  submitting = false;
  isSwitchMode = false;
  activeOrgId = '';
  selectedOrgId: string | null = null;
  selectedRole: RoleIntent | null = null;
  orgDropdownOpen = false;

  constructor(
    private organizationApi: OrganizationApiService,
    private postLoginWorkflow: PostLoginWorkflowService,
    private authService: AuthService,
    private commonService: CommonService,
    private router: Router,
    private route: ActivatedRoute,
    private host: ElementRef<HTMLElement>
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.isSwitchMode = this.route.snapshot.queryParamMap.get('switch') === 'true';
    this.activeOrgId = sessionStorage.getItem('organization_id') || '';
    this.selectedOrgId = null;
    this.selectedRole = null;
    this.loadOrganizations();
  }

  get selectedOrganization(): UserOrganizationEntry | null {
    if (!this.selectedOrgId) {
      return null;
    }
    return this.organizations.find((o) => o.id === this.selectedOrgId) ?? null;
  }

  get loggedInEmail(): string {
    const user = this.commonService.loginedUserInfo ?? this.readUserFromSession();
    return (user?.email || user?.contact?.email || '').trim();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.orgDropdownOpen) {
      return;
    }
    const target = event.target as Node | null;
    if (target && !this.host.nativeElement.querySelector('.org-picker-dropdown')?.contains(target)) {
      this.orgDropdownOpen = false;
    }
  }

  toggleOrgDropdown(): void {
    if (this.submitting) {
      return;
    }
    this.orgDropdownOpen = !this.orgDropdownOpen;
  }

  private async loadOrganizations(): Promise<void> {
    this.loading = true;
    try {
      if (this.isSwitchMode) {
        await this.loadUserOrganizations();
      } else {
        await this.loadAllOrganizations();
      }

      if (!this.organizations.length) {
        sessionStorage.removeItem('needsOrgPicker');
        this.commonService.openToaster({
          message: 'No organizations found.',
          messageType: TOASTER_MESSAGE_TYPE.ERROR,
        });
        this.router.navigate(['/dashboard/approval-pending'], {
          state: {
            infoMessage: 'No organizations are available yet. Please contact your administrator.',
          },
        });
      }
    } catch {
      this.commonService.openToaster({
        message: 'Unable to load organizations. Please try again.',
        messageType: TOASTER_MESSAGE_TYPE.ERROR,
      });
    } finally {
      this.loading = false;
    }
  }

  /** Full organization catalog for join flow — pick any one. */
  private async loadAllOrganizations(): Promise<void> {
    const res: any = await firstValueFrom(this.organizationApi.getOrganizations());
    const data = res?.data ?? res ?? [];
    const list = Array.isArray(data) ? data : [];
    this.organizations = list
      .map((entry: any) => ({
        id: entry.id ?? '',
        name: entry.name ?? 'Unnamed organization',
        email: entry.contact?.email ?? entry.email,
      }))
      .filter((o: UserOrganizationEntry) => !!o.id)
      .sort((a, b) => this.displayName(a.name).localeCompare(this.displayName(b.name)));
  }

  /** Orgs the user already belongs to (switch mode). */
  private async loadUserOrganizations(): Promise<void> {
    const cached = sessionStorage.getItem('pendingUserOrganizations');
    if (cached) {
      this.organizations = JSON.parse(cached) as UserOrganizationEntry[];
      return;
    }

    const user = this.commonService.loginedUserInfo ?? this.readUserFromSession();
    const res: any = await firstValueFrom(
      this.organizationApi.listOrganizationsForUser({
        userId: user?.id,
        email: user?.email || user?.contact?.email,
      })
    );
    const data = res?.data ?? res ?? [];
    const list = Array.isArray(data) ? data : [];
    this.organizations = list
      .map((entry: any) => ({
        id: entry.organization?.id ?? entry.id ?? '',
        name: entry.organization?.name ?? entry.name ?? 'Unnamed organization',
        email: entry.organization?.contact?.email ?? entry.contact?.email,
        membershipRole: entry.membership?.role ?? entry.role,
      }))
      .filter((o: UserOrganizationEntry) => !!o.id);
  }

  displayName(name: string): string {
    return decodeText(name);
  }

  pickOrganization(orgId: string): void {
    if (this.submitting) return;

    if (this.isSwitchMode) {
      this.orgDropdownOpen = false;
      this.switchOrganization(orgId);
      return;
    }

    if (this.selectedOrgId !== orgId) {
      this.selectedRole = null;
    }
    this.selectedOrgId = orgId;
    this.orgDropdownOpen = false;
  }

  pickRole(role: RoleIntent): void {
    if (this.submitting || this.isSwitchMode) return;
    this.selectedRole = role;
  }

  get canContinue(): boolean {
    return !!this.selectedOrgId && !!this.selectedRole && !this.submitting;
  }

  async continueToDashboard(): Promise<void> {
    if (!this.canContinue || !this.selectedOrgId || !this.selectedRole) return;
    await this.completeSelection(this.selectedOrgId, this.selectedRole);
  }

  private async switchOrganization(orgId: string): Promise<void> {
    if (this.submitting) return;
    this.submitting = true;
    try {
      const org = this.organizations.find((o) => o.id === orgId);
      if (org?.name) {
        sessionStorage.setItem('activeOrganizationName', org.name);
      }
      sessionStorage.removeItem('pendingUserOrganizations');
      await this.postLoginWorkflow.selectOrganization(orgId, { skipRouting: true });
      this.commonService.openToaster({
        message: 'Organization switched successfully.',
        messageType: TOASTER_MESSAGE_TYPE.SUCCESS,
      });
      await this.postLoginWorkflow.continueRoutingForCurrentUser();
    } catch (error: any) {
      this.commonService.openToaster({
        message: error?.message || 'Unable to select organization.',
        messageType: TOASTER_MESSAGE_TYPE.ERROR,
      });
    } finally {
      this.submitting = false;
    }
  }

  private async completeSelection(orgId: string, role: RoleIntent): Promise<void> {
    this.submitting = true;
    try {
      const org = this.organizations.find((o) => o.id === orgId);
      if (org?.name) {
        sessionStorage.setItem('activeOrganizationName', org.name);
      }
      await this.postLoginWorkflow.selectOrganization(orgId, { roleIntent: role });
    } catch (error: any) {
      this.commonService.openToaster({
        message: error?.message || 'Unable to join organization. Please try again.',
        messageType: TOASTER_MESSAGE_TYPE.ERROR,
      });
    } finally {
      this.submitting = false;
    }
  }

  backToLogin(event: Event): void {
    event.preventDefault();
    this.authService.logOutApplication();
  }

  cancelSwitch(): void {
    this.router.navigate(['/dashboard/overview']);
  }

  private readUserFromSession() {
    try {
      const raw = sessionStorage.getItem('login_details');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
