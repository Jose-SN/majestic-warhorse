import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { PostLoginWorkflowService } from 'src/app/core/auth/post-login-workflow.service';
import { UserOrganizationEntry } from 'src/app/models/organization-picker.model';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { IamFacade } from 'src/app/store/iam/iam.facade';
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
  orgDropdownOpen = false;
  orgSearchQuery = '';
  dropdownPanelStyle: Record<string, string> = {};

  @ViewChild('orgDropdownTrigger') orgDropdownTrigger?: ElementRef<HTMLButtonElement>;
  @ViewChild('orgSearchInput') orgSearchInput?: ElementRef<HTMLInputElement>;

  constructor(
    private iam: IamFacade,
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
    this.selectedOrgId = this.activeOrgId || null;
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

  get canContinue(): boolean {
    return !!this.selectedOrgId && !this.submitting;
  }

  get filteredOrganizations(): UserOrganizationEntry[] {
    const query = this.orgSearchQuery.trim().toLowerCase();
    if (!query) {
      return this.organizations;
    }

    return this.organizations.filter((org) => {
      const name = this.displayName(org.name).toLowerCase();
      const email = (org.email || '').toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.orgDropdownOpen) {
      return;
    }
    const target = event.target as Node | null;
    const section = this.host.nativeElement.querySelector('.org-picker-section');
    if (target && section?.contains(target)) {
      return;
    }
    this.closeOrgDropdown();
  }

  @HostListener('window:resize')
  @HostListener('window:scroll')
  onViewportChange(): void {
    if (this.orgDropdownOpen) {
      this.syncDropdownPanelPosition();
    }
  }

  toggleOrgDropdown(): void {
    if (this.submitting) {
      return;
    }
    if (this.orgDropdownOpen) {
      this.closeOrgDropdown();
      return;
    }
    this.openOrgDropdown();
  }

  openOrgDropdown(): void {
    this.orgSearchQuery = '';
    this.orgDropdownOpen = true;
    requestAnimationFrame(() => {
      this.syncDropdownPanelPosition();
      this.orgSearchInput?.nativeElement.focus();
    });
  }

  closeOrgDropdown(): void {
    this.orgDropdownOpen = false;
    this.orgSearchQuery = '';
  }

  onOrgSearchInput(event: Event): void {
    this.orgSearchQuery = (event.target as HTMLInputElement).value;
  }

  private syncDropdownPanelPosition(): void {
    const trigger = this.orgDropdownTrigger?.nativeElement;
    if (!trigger) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const maxPanelHeight = 320;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUp = spaceBelow < 200 && spaceAbove > spaceBelow;
    const availableHeight = Math.max(180, Math.min(maxPanelHeight, openUp ? spaceAbove : spaceBelow));

    this.dropdownPanelStyle = {
      position: 'fixed',
      width: `${rect.width}px`,
      maxHeight: `${availableHeight}px`,
      zIndex: '1200',
    };
  }

  private async loadOrganizations(): Promise<void> {
    this.loading = true;
    try {
      await this.loadUserOrganizations();

      if (!this.organizations.length) {
        sessionStorage.removeItem('needsOrgPicker');
        this.commonService.openToaster({
          message: 'No organizations found.',
          messageType: TOASTER_MESSAGE_TYPE.ERROR,
        });
        this.router.navigate(['/approval-pending'], {
          state: {
            infoMessage: 'No organizations are available yet. Please contact your administrator.',
          },
        });
        return;
      }

      // Prefer the user's current org, otherwise the first membership.
      if (!this.selectedOrgId || !this.organizations.some((o) => o.id === this.selectedOrgId)) {
        this.selectedOrgId = this.activeOrgId && this.organizations.some((o) => o.id === this.activeOrgId)
          ? this.activeOrgId
          : this.organizations[0].id;
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

  /** Orgs the user already belongs to (login picker + switch mode). */
  private async loadUserOrganizations(): Promise<void> {
    const cached = sessionStorage.getItem('pendingUserOrganizations');
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as UserOrganizationEntry[];
        if (Array.isArray(parsed) && parsed.length) {
          this.organizations = parsed;
          return;
        }
      } catch {
        // fall through to API
      }
    }

    const user = this.commonService.loginedUserInfo ?? this.readUserFromSession();
    this.organizations = await firstValueFrom(
      this.iam.loadOrganizationsForUser({
        userId: user?.id,
        email: user?.email || user?.contact?.email,
      })
    );
  }

  displayName(name: string): string {
    return decodeText(name);
  }

  pickOrganization(orgId: string): void {
    if (this.submitting) return;
    this.selectedOrgId = orgId;
    this.closeOrgDropdown();

    // Switch mode still applies immediately on pick.
    if (this.isSwitchMode) {
      void this.continueToDashboard();
    }
  }

  async continueToDashboard(): Promise<void> {
    if (!this.canContinue || !this.selectedOrgId) return;

    this.submitting = true;
    try {
      const org = this.organizations.find((o) => o.id === this.selectedOrgId);
      if (org?.name) {
        sessionStorage.setItem('activeOrganizationName', org.name);
      }
      sessionStorage.removeItem('pendingUserOrganizations');
      sessionStorage.removeItem('needsOrgPicker');
      sessionStorage.removeItem('pendingRoleIntent');

      await this.postLoginWorkflow.selectOrganization(this.selectedOrgId, {
        skipRouting: true,
      });

      if (this.isSwitchMode) {
        this.commonService.openToaster({
          message: 'Organization switched successfully.',
          messageType: TOASTER_MESSAGE_TYPE.SUCCESS,
        });
      }

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

  backToLogin(event: Event): void {
    event.preventDefault();
    this.authService.logOutApplication();
  }

  cancelSwitch(): void {
    this.router.navigate(['/dashboard']);
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
