import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DashboardSidepanelComponent } from 'src/app/components/dashboard-sidepanel/dashboard-sidepanel.component';
import { DashboardService } from './dashboard.service';
import { ICourseList } from '../courses/modal/course-list';
import { Subject, takeUntil } from 'rxjs';
import { CommonService } from 'src/app/shared/services/common.service';
import { CommonSearchProfileComponent } from 'src/app/components/common-search-profile/common-search-profile.component';
import { AssignTeacherService } from 'src/app/components/assign-teachers/assign-teacher.service';
import { DASHBOARD_NAV_ROUTES, DASHBOARD_TECHNICAL_BACKDROP_SEGMENTS, isDashboardNavActive } from './dashboard-routes.config';
import { BannerComponent } from 'src/app/shared/banner/banner.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    RouterModule,
    DashboardSidepanelComponent,
    CommonSearchProfileComponent,
    BannerComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  public isMobileNav = false;
  public infoMessage: string = '';
  private destroy$ = new Subject<void>();

  constructor(
    private dashboardService: DashboardService,
    private commonService: CommonService,
    private router: Router,
    private assignTeacherService: AssignTeacherService
  ) {}

  get isAdminLogin() {
    return this.commonService.adminRoleType.includes(
      this.commonService?.loginedUserInfo?.role ?? ''
    );
  }

  get isApprovalPendingRoute(): boolean {
    return this.router.url.includes(DASHBOARD_NAV_ROUTES.approvalPending);
  }

  get showTechnicalBackdrop(): boolean {
    return isDashboardNavActive(this.router.url, DASHBOARD_TECHNICAL_BACKDROP_SEGMENTS);
  }

  ngOnInit(): void {
    if (sessionStorage.getItem('needsOrgPicker') === 'true') {
      this.router.navigate(['/org-picker']);
      return;
    }

    this.dashboardService
      .getCourseDetailsInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe((courseInfo: { [key: string]: boolean | ICourseList }) => {
        this.handleCourseDetailsView(courseInfo);
      });

    const loginedUserData = this.commonService.loginedUserInfo;
    const organizationId = sessionStorage.getItem('organization_id') || loginedUserData?.organization_id || '';

    if (loginedUserData?.role === 'student') {
      const studentId = loginedUserData.id;
      if (studentId) {
        this.assignTeacherService.getAssignedTeachers(studentId, organizationId).subscribe({
          next: (res: any) => {
            const data = res?.data ?? res;
            const list = Array.isArray(data) ? data : [];
            this.commonService.hasAssignedTeachers = list.length > 0;
          },
          error: () => {
            this.commonService.hasAssignedTeachers = false;
          },
        });
      } else {
        this.commonService.hasAssignedTeachers = false;
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private handleCourseDetailsView(showCourseView: {
    [key: string]: boolean | ICourseList;
  }) {
    const showCourseDetail = showCourseView['showCourseDetail'] as boolean;
    const selectedCourse = showCourseView['selectedCourse'] as ICourseList;

    if (showCourseDetail && selectedCourse) {
      this.router.navigate([DASHBOARD_NAV_ROUTES.courseDetails], {
        state: { selectedCourse },
      });
    } else {
      this.router.navigate([DASHBOARD_NAV_ROUTES.courses]);
    }
  }

  btnMobileMenu() {
    this.isMobileNav = !this.isMobileNav;
  }

  isMobileNavActive(section: 'overview' | 'courses' | 'network' | 'account' | 'ai-mode'): boolean {
    const url = this.router.url;
    switch (section) {
      case 'overview':
        return url.includes(DASHBOARD_NAV_ROUTES.overview) || url.includes(DASHBOARD_NAV_ROUTES.courseOverview) || url === '/dashboard';
      case 'ai-mode':
        return url.includes(DASHBOARD_NAV_ROUTES.aiMode);
      case 'courses':
        return url.includes(DASHBOARD_NAV_ROUTES.courses) || url.includes(DASHBOARD_NAV_ROUTES.courseDetails);
      case 'account':
        return url.includes(DASHBOARD_NAV_ROUTES.account);
      case 'network': {
        const role = this.commonService.loginedUserInfo?.role || '';
        if (role === 'organization' || role === 'teacher') {
          return url.includes(DASHBOARD_NAV_ROUTES.directory);
        }
        return url.includes(DASHBOARD_NAV_ROUTES.directory);
      }
      default:
        return false;
    }
  }

  navigateMobile(section: 'overview' | 'courses' | 'network' | 'account' | 'ai-mode'): void {
    this.isMobileNav = false;
    const role = this.commonService.loginedUserInfo?.role || '';

    const routes: Record<string, string> = {
      overview: DASHBOARD_NAV_ROUTES.overview,
      'ai-mode': DASHBOARD_NAV_ROUTES.aiMode,
      courses: DASHBOARD_NAV_ROUTES.courses,
      account: DASHBOARD_NAV_ROUTES.account,
      network:
        role === 'organization'
          ? DASHBOARD_NAV_ROUTES.teachers
          : DASHBOARD_NAV_ROUTES.students,
    };

    this.router.navigate([routes[section]]);
  }
}
