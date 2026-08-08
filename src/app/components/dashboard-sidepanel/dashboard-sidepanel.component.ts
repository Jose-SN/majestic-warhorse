import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormControl, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import {
  DASHBOARD_NAV_ACTIVE_SEGMENTS,
  DASHBOARD_NAV_ROUTES,
  isDashboardNavActive,
} from 'src/app/pages/dashboard/dashboard-routes.config';
import { UserModel } from 'src/app/pages/login-page/model/user-model';
import { AppService } from 'src/app/shared/services/app.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { IModelInfo } from '../common-dialog/model/popupmodel';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { BrandingService } from 'src/app/core/branding/branding.service';

const SIDEBAR_COLLAPSED_KEY = 'mw-sidebar-collapsed';

@Component({
  selector: 'app-dashboard-sidepanel',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './dashboard-sidepanel.component.html',
  styleUrl: './dashboard-sidepanel.component.scss',
})
export class DashboardSidepanelComponent implements OnInit, OnDestroy {
  @Input() navDisabled = false;
  @Input() collapsed = false;
  @Output() collapsedChange = new EventEmitter<boolean>();
  public mobMenu: boolean = false;
  public loginedUserPrivilege: string = '';
  public loginedUserInfo: UserModel = {} as UserModel;
  public userMenuOpen = false;
  public currentYear: number = new Date().getFullYear();
  private destroy$ = new Subject<void>();
  public showAssigningPopup: boolean = false;
  brandLogo = 'assets/images/logo-majestic-hourse.svg';
  appName = 'PetaxAI Learning';
  readonly navRoutes = DASHBOARD_NAV_ROUTES;
  readonly navActiveSegments = DASHBOARD_NAV_ACTIVE_SEGMENTS;

  @ViewChild('userMenu') userMenuRef?: ElementRef<HTMLElement>;
  public popupModelInfo: IModelInfo = {
    title: 'Assign Teacher',
    isDynamicContent: true,
    data: null,
  } as IModelInfo;
  public assignedTo: FormControl = new FormControl([]);

  constructor(
    public commonService: CommonService,
    private router: Router,
    public appService: AppService,
    public authService: AuthService,
    private brandingService: BrandingService
  ) {
    this.loginedUserPrivilege = this.commonService.loginedUserInfo?.role || '';
  }

  ngOnInit(): void {
    this.loginedUserInfo = this.commonService.loginedUserInfo ?? {};
    this.loginedUserInfo.profileImage = this.commonService.decodeUrl(
      (this.loginedUserInfo.profileImage || this.loginedUserInfo.profile_image) ?? ''
    );
    this.brandingService.branding$.pipe(takeUntil(this.destroy$)).subscribe((branding) => {
      this.brandLogo = branding.logoUrl;
      this.appName = branding.appName;
    });

    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (stored === 'true' || stored === 'false') {
        this.setCollapsed(stored === 'true', false);
      }
    } catch {
      // ignore
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isNavActive(segments: readonly string[]): boolean {
    return isDashboardNavActive(this.router.url, segments);
  }

  onNavClick(event: Event): void {
    if (this.disableListItems()) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  navigateToHome(): void {
    if (this.disableListItems()) {
      return;
    }
    void this.router.navigate([DASHBOARD_NAV_ROUTES.overview]);
  }

  disableListItems(): boolean {
    return this.navDisabled;
  }

  @HostBinding('class.sidepanel--nav-disabled')
  get isNavLocked(): boolean {
    return this.disableListItems();
  }

  @HostBinding('class.sidepanel--collapsed')
  get isCollapsedHost(): boolean {
    return this.collapsed;
  }

  toggleCollapsed(event?: Event): void {
    event?.stopPropagation();
    this.setCollapsed(!this.collapsed);
  }

  private setCollapsed(value: boolean, persist = true): void {
    this.collapsed = value;
    this.collapsedChange.emit(value);
    if (!persist) {
      return;
    }
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(value));
    } catch {
      // ignore
    }
  }

  get isOrganizationAccount(): boolean {
    return (
      sessionStorage.getItem('loginType') === 'organization' ||
      this.loginedUserInfo.role === 'organization'
    );
  }

  get userAccountTypeLabel(): string {
    return this.isOrganizationAccount ? 'Organization' : 'User';
  }

  get userDisplayName(): string {
    const info = this.loginedUserInfo;
    if (this.isOrganizationAccount) {
      return info.name?.trim() || sessionStorage.getItem('activeOrganizationName')?.trim() || '';
    }

    const first = (info.firstName || info.first_name || '').trim();
    const last = (info.lastName || info.last_name || '').trim();
    return [first, last].filter(Boolean).join(' ');
  }

  get userEmail(): string {
    return this.loginedUserInfo.email || this.loginedUserInfo.contact?.email || '';
  }

  get userPhone(): string {
    return this.loginedUserInfo.phone || this.loginedUserInfo.contact?.phone || '';
  }

  get userRoleLabel(): string {
    return this.commonService.transformText(this.loginedUserPrivilege || this.loginedUserInfo.role || '');
  }

  get hasProfileImage(): boolean {
    return !!(this.loginedUserInfo.profileImage || this.loginedUserInfo.profile_image)?.trim();
  }

  get profileImageUrl(): string {
    return this.loginedUserInfo.profileImage || this.loginedUserInfo.profile_image || this.brandLogo;
  }

  get userInitial(): string {
    const source = this.userDisplayName || this.userEmail || 'U';
    return source.charAt(0).toUpperCase();
  }

  get organizationName(): string {
    const fromSession = sessionStorage.getItem('activeOrganizationName')?.trim() || '';
    if (fromSession) {
      return fromSession;
    }

    if (this.isOrganizationAccount) {
      return this.loginedUserInfo.name?.trim() || '';
    }

    return '';
  }

  get showSwitchOrganization(): boolean {
    return !this.isOrganizationAccount && this.loginedUserPrivilege !== 'organization';
  }

  get hasDashboardPermission(): boolean {
    return !this.disableListItems();
  }

  toggleUserMenu(event: Event): void {
    event.stopPropagation();
    this.userMenuOpen = !this.userMenuOpen;
  }

  closeUserMenu(): void {
    this.userMenuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.userMenuOpen) {
      return;
    }

    const menu = this.userMenuRef?.nativeElement;
    if (menu && !menu.contains(event.target as Node)) {
      this.userMenuOpen = false;
    }
  }

  goToAccount(): void {
    if (!this.hasDashboardPermission) {
      return;
    }
    this.closeUserMenu();
    void this.router.navigate([DASHBOARD_NAV_ROUTES.account]);
  }

  goToSwitchOrganization(): void {
    if (!this.hasDashboardPermission) {
      return;
    }
    this.closeUserMenu();
    void this.router.navigate([DASHBOARD_NAV_ROUTES.switchOrg], { queryParams: { switch: true } });
  }

  logOut(): void {
    this.closeUserMenu();
    this.authService.logOutApplication();
  }

  onUpgradeToPro(): void {
    void this.router.navigate([DASHBOARD_NAV_ROUTES.pricing]);
  }
}
