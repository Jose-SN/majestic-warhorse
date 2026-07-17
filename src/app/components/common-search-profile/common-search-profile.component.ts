import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';
import { UserModel } from 'src/app/pages/login-page/model/user-model';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { DemoModeService } from 'src/app/shared/services/demo-mode.service';
import { DASHBOARD_NAV_ROUTES } from 'src/app/pages/dashboard/dashboard-routes.config';

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
  @Output() mobNavchild = new EventEmitter<void>();
  public mobMenu: boolean = false;
  public loginedUserInfo: UserModel = {} as UserModel;
  private destroy$ = new Subject<void>();
  constructor(
    private authService: AuthService,
    public commonService: CommonService,
    public demoModeService: DemoModeService,
    private router: Router
  ) {
    this.loginedUserInfo = this.commonService.loginedUserInfo;
    this.profileUrl = (this.commonService.loginedUserInfo.profileImage || this.commonService.loginedUserInfo.profile_image) ?? '';
  }

  ngOnInit(): void {
    this.updateRouteContext(this.router.url);
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => this.updateRouteContext(event.urlAfterRedirects));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  navigateBackToCourses(): void {
    void this.router.navigate([DASHBOARD_NAV_ROUTES.courses]);
  }

  private updateRouteContext(url: string): void {
    this.isCourseDetailsRoute = url.includes(DASHBOARD_NAV_ROUTES.courseDetails);
  }
  logOut() {
    this.authService.logOutApplication();
  }
  
  btnMob() {
    this.mobNavchild.emit();
    this.isMobileNav = !this.isMobileNav;
  }
  setInputSearch() {
    this.commonService.setCommonSearchText(this.searchText);
  }

  toggleDemoMode(): void {
    this.demoModeService.toggleDemoMode();
  }
}
