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
  public activityFeedItems: ActivityFeedItem[] = [];
  @Output() mobNavchild = new EventEmitter<void>();
  public mobMenu: boolean = false;
  public loginedUserInfo: UserModel = {} as UserModel;
  readonly brandLogo = 'assets/images/logo-majestic-hourse.svg';
  private destroy$ = new Subject<void>();

  @ViewChild('userMenu') userMenuRef?: ElementRef<HTMLElement>;
  @ViewChild('notificationMenu') notificationMenuRef?: ElementRef<HTMLElement>;

  constructor(
    private authService: AuthService,
    public commonService: CommonService,
    public demoModeService: DemoModeService,
    private router: Router
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
    return !!(this.loginedUserInfo.profileImage || this.loginedUserInfo.profile_image)?.trim();
  }

  get profileImageUrl(): string {
    return this.loginedUserInfo.profileImage || this.loginedUserInfo.profile_image || this.brandLogo;
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
    this.userMenuOpen = !this.userMenuOpen;
  }

  closeUserMenu(): void {
    this.userMenuOpen = false;
  }

  toggleActivityFeed(event: Event): void {
    event.stopPropagation();
    this.closeUserMenu();
    this.activityFeedOpen = !this.activityFeedOpen;

    if (this.activityFeedOpen && this.demoModeService.isDemoMode && !this.activityFeedItems.length) {
      this.activityFeedItems = structuredClone(DASHBOARD_DEMO_DATA.insights.activityFeed);
    }
  }

  closeActivityFeed(): void {
    this.activityFeedOpen = false;
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
}
