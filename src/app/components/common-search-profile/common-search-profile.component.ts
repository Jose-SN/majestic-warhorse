import { Component, ElementRef, EventEmitter, HostListener, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';
import { UserModel } from 'src/app/pages/login-page/model/user-model';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { DemoModeService } from 'src/app/shared/services/demo-mode.service';
import { DASHBOARD_NAV_ROUTES } from 'src/app/pages/dashboard/dashboard-routes.config';
import {
  ActivityFeedItem,
  DASHBOARD_DEMO_DATA,
} from 'src/app/components/dashboard-overview/data/dashboard-demo.data';
import { BrandingService } from 'src/app/core/branding/branding.service';
import { ThemeService } from 'src/app/core/theme/theme.service';
import { AppThemeMode, ThemeOption } from 'src/app/core/theme/theme.model';

@Component({
  selector: 'app-search-profile',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './common-search-profile.component.html',
  styleUrl: './common-search-profile.component.scss'
})
export class CommonSearchProfileComponent implements OnInit, OnDestroy {
  public isMobileNav = false;
  public profileUrl: string = '';
  public searchText: string = '';
  public isCourseDetailsRoute = false;
  public userMenuOpen = false;
  public activityFeedOpen = false;
  public themeMenuOpen = false;
  public activityFeedItems: ActivityFeedItem[] = [];
  public themeOptions: ThemeOption[] = [];
  public activeTheme: AppThemeMode = 'dark';
  @Output() mobNavchild = new EventEmitter<void>();
  public mobMenu: boolean = false;
  public loginedUserInfo: UserModel = {} as UserModel;
  brandLogo = 'assets/images/logo-majestic-hourse.svg';
  appName = 'PetaxAI Learning';
  private destroy$ = new Subject<void>();

  @ViewChild('userMenu') userMenuRef?: ElementRef<HTMLElement>;
  @ViewChild('notificationMenu') notificationMenuRef?: ElementRef<HTMLElement>;
  @ViewChild('themeMenu') themeMenuRef?: ElementRef<HTMLElement>;

  constructor(
    private authService: AuthService,
    public commonService: CommonService,
    public demoModeService: DemoModeService,
    private router: Router,
    private brandingService: BrandingService,
    private themeService: ThemeService
  ) {
    this.loginedUserInfo = this.commonService.loginedUserInfo ?? {};
    this.profileUrl =
      (this.commonService.loginedUserInfo?.profileImage ||
        this.commonService.loginedUserInfo?.profile_image) ??
      '';
  }

  ngOnInit(): void {
    this.loginedUserInfo = this.commonService.loginedUserInfo ?? {};
    this.loginedUserInfo.profileImage = this.commonService.decodeUrl(
      (this.loginedUserInfo.profileImage || this.loginedUserInfo.profile_image) ?? ''
    );
    this.updateRouteContext(this.router.url);
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => this.updateRouteContext(event.urlAfterRedirects));

    this.commonService
      .getActivityFeed$()
      .pipe(takeUntil(this.destroy$))
      .subscribe((items) => {
        this.activityFeedItems = items ?? [];
      });

    this.demoModeService.demoMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isDemo) => {
        if (isDemo) {
          this.activityFeedItems = structuredClone(DASHBOARD_DEMO_DATA.insights.activityFeed);
          this.commonService.setActivityFeed(this.activityFeedItems);
        }
      });

    this.brandingService.branding$.pipe(takeUntil(this.destroy$)).subscribe((branding) => {
      this.brandLogo = this.withCacheBust(branding.logoUrl, branding.updatedAt);
      this.appName = branding.appName;
    });

    this.commonService
      .getUserProfile$()
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        if (!user) {
          return;
        }
        this.loginedUserInfo = {
          ...user,
          profileImage: this.commonService.decodeUrl(
            (user.profileImage || user.profile_image) ?? ''
          ),
        };
      });

    this.themeOptions = this.themeService.options;
    this.activeTheme = this.themeService.mode;
    this.themeService.mode$.pipe(takeUntil(this.destroy$)).subscribe((mode) => {
      this.activeTheme = mode;
    });
  }

  get themeTriggerIcon(): string {
    const match = this.themeOptions.find((o) => o.id === this.activeTheme);
    return match?.icon || 'palette';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isOrganizationAccount(): boolean {
    return (
      sessionStorage.getItem('loginType') === 'organization' ||
      this.loginedUserInfo.role === 'organization'
    );
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
    return this.commonService.transformText(
      this.commonService.loginedUserInfo?.role || this.loginedUserInfo.role || ''
    );
  }

  get hasProfileImage(): boolean {
    const info = this.commonService.loginedUserInfo || this.loginedUserInfo;
    return !!(info?.profileImage || info?.profile_image)?.trim();
  }

  get profileImageUrl(): string {
    const info = this.commonService.loginedUserInfo || this.loginedUserInfo;
    const url = info?.profileImage || info?.profile_image || '';
    return url?.trim() ? this.commonService.decodeUrl(url) : this.brandLogo;
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
    return !this.isOrganizationAccount && this.loginedUserInfo.role !== 'organization';
  }

  toggleUserMenu(event: Event): void {
    event.stopPropagation();
    this.closeActivityFeed();
    this.closeThemeMenu();
    this.userMenuOpen = !this.userMenuOpen;
  }

  closeUserMenu(): void {
    this.userMenuOpen = false;
  }

  toggleActivityFeed(event: Event): void {
    event.stopPropagation();
    this.closeUserMenu();
    this.closeThemeMenu();
    this.activityFeedOpen = !this.activityFeedOpen;

    if (this.activityFeedOpen && this.demoModeService.isDemoMode && !this.activityFeedItems.length) {
      this.activityFeedItems = structuredClone(DASHBOARD_DEMO_DATA.insights.activityFeed);
    }
  }

  closeActivityFeed(): void {
    this.activityFeedOpen = false;
  }

  toggleThemeMenu(event: Event): void {
    event.stopPropagation();
    this.closeUserMenu();
    this.closeActivityFeed();
    this.themeMenuOpen = !this.themeMenuOpen;
  }

  closeThemeMenu(): void {
    this.themeMenuOpen = false;
  }

  selectTheme(mode: AppThemeMode): void {
    this.themeService.setTheme(mode);
    this.closeThemeMenu();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node;

    if (this.userMenuOpen) {
      const menu = this.userMenuRef?.nativeElement;
      if (menu && !menu.contains(target)) {
        this.userMenuOpen = false;
      }
    }

    if (this.activityFeedOpen) {
      const notifications = this.notificationMenuRef?.nativeElement;
      if (notifications && !notifications.contains(target)) {
        this.activityFeedOpen = false;
      }
    }

    if (this.themeMenuOpen) {
      const theme = this.themeMenuRef?.nativeElement;
      if (theme && !theme.contains(target)) {
        this.themeMenuOpen = false;
      }
    }
  }

  goToAccount(): void {
    this.closeUserMenu();
    void this.router.navigate([DASHBOARD_NAV_ROUTES.account]);
  }

  goToSwitchOrganization(): void {
    this.closeUserMenu();
    void this.router.navigate([DASHBOARD_NAV_ROUTES.switchOrg], { queryParams: { switch: true } });
  }

  navigateBackToCourses(): void {
    void this.router.navigate([DASHBOARD_NAV_ROUTES.courses]);
  }

  private updateRouteContext(url: string): void {
    this.isCourseDetailsRoute = url.includes(DASHBOARD_NAV_ROUTES.courseDetails);
  }

  logOut(): void {
    this.closeUserMenu();
    this.authService.logOutApplication();
  }

  btnMob(): void {
    this.mobNavchild.emit();
    this.isMobileNav = !this.isMobileNav;
  }

  setInputSearch(): void {
    this.commonService.setCommonSearchText(this.searchText);
  }

  toggleDemoMode(): void {
    this.demoModeService.toggleDemoMode();
  }

  private withCacheBust(url: string, version?: string): string {
    if (!url || url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('assets/')) {
      return url;
    }
    const stamp = version || String(Date.now());
    try {
      const parsed = new URL(url, window.location.origin);
      parsed.searchParams.set('v', stamp);
      return parsed.toString();
    } catch {
      const sep = url.includes('?') ? '&' : '?';
      return `${url}${sep}v=${encodeURIComponent(stamp)}`;
    }
  }
}
