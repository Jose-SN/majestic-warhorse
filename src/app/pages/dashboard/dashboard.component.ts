import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DashboardSidepanelComponent } from 'src/app/components/dashboard-sidepanel/dashboard-sidepanel.component';
import { DashboardService } from './dashboard.service';
import { ISidepanel } from './modal/dashboard-modal';
import { ICourseList } from '../courses/modal/course-list';
import { Subject, takeUntil } from 'rxjs';
import { CommonService } from 'src/app/shared/services/common.service';
import { CommonSearchProfileComponent } from 'src/app/components/common-search-profile/common-search-profile.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    RouterModule,
    DashboardSidepanelComponent,
    CommonSearchProfileComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  public isMobileNav = false;
  public activePanel: string = '';
  public infoMessage: string = '';
  public SIDE_PANEL_LIST: ISidepanel = this.dashboardService.SIDE_PANEL_LIST;
  private destroy$ = new Subject<void>();

  constructor(
    private dashboardService: DashboardService,
    private commonService: CommonService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.activePanel = this.SIDE_PANEL_LIST['DASHBOARD_OVERVIEW'];
  }

  get isAdminLogin() {
    return this.commonService.adminRoleType.includes(
      this.commonService?.loginedUserInfo?.role ?? ''
    );
  }

  ngOnInit(): void {
    this.dashboardService
      .getSidePanelChange()
      .pipe(takeUntil(this.destroy$))
      .subscribe((activePanel: string) => {
        this.activePanel = activePanel;
      });

    this.dashboardService
      .getCourseDetailsInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe((courseInfo: { [key: string]: boolean | ICourseList }) => {
        this.handleCourseDetailsView(courseInfo);
      });

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.updateActivePanelFromRoute();
      });

    const loginedUserData = this.commonService.loginedUserInfo;
    if (loginedUserData?.role === 'student' && !loginedUserData.assignedTo?.length) {
      this.activePanel = this.SIDE_PANEL_LIST['APPROVAL_PENDING'];
      this.infoMessage =
        'You have not been assigned any teachers to view this course. Please contact the admin for assistance';
      this.router.navigate(['/dashboard/approval-pending'], {
        state: { infoMessage: this.infoMessage },
      });
    } else if (
      loginedUserData?.role === 'teacher' &&
      loginedUserData.status === 'pending'
    ) {
      this.activePanel = this.SIDE_PANEL_LIST['APPROVAL_PENDING'];
      this.infoMessage =
        'Your request is pending approval from the admin. Please reach out to the admin for assistance.';
      this.router.navigate(['/dashboard/approval-pending'], {
        state: { infoMessage: this.infoMessage },
      });
    } else {
      this.updateActivePanelFromRoute();
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
      this.router.navigate(['/dashboard/course-details'], {
        state: { selectedCourse },
      });
    } else {
      this.router.navigate(['/dashboard/courses']);
    }
  }

  private updateActivePanelFromRoute() {
    const route = this.activatedRoute.firstChild;
    if (route) {
      const routePath = route.snapshot.routeConfig?.path || '';
      const panelMap: { [key: string]: string } = {
        overview: this.SIDE_PANEL_LIST['DASHBOARD_OVERVIEW'],
        'course-overview': this.SIDE_PANEL_LIST['DASHBOARD_OVERVIEW'],
        courses: this.SIDE_PANEL_LIST['COURSE_LISTING'],
        'course-details': this.SIDE_PANEL_LIST['COURSE_LISTING'],
        account: this.SIDE_PANEL_LIST['ACCOUNT'],
        teachers: this.SIDE_PANEL_LIST['TEACHERS_LISTING'],
        students: this.SIDE_PANEL_LIST['STUDENTS_LISTING'],
        approval: this.SIDE_PANEL_LIST['TEACHER_APPROVAL'],
        'approval-pending': this.SIDE_PANEL_LIST['APPROVAL_PENDING'],
        'assign-teacher': this.SIDE_PANEL_LIST['ASSIGN_TEACHER'],
        assessment: this.SIDE_PANEL_LIST['ASSESMENT'],
      };
      const panel = panelMap[routePath] || '';
      if (panel) {
        this.activePanel = panel;
        this.dashboardService.setSidePanelChangeValue(panel);
      }
    } else {
      const currentUrl = this.router.url;
      const urlParts = currentUrl.split('/');
      const routePath = urlParts[urlParts.length - 1] || '';
      const panelMap: { [key: string]: string } = {
        overview: this.SIDE_PANEL_LIST['DASHBOARD_OVERVIEW'],
        'course-overview': this.SIDE_PANEL_LIST['DASHBOARD_OVERVIEW'],
        courses: this.SIDE_PANEL_LIST['COURSE_LISTING'],
        'course-details': this.SIDE_PANEL_LIST['COURSE_LISTING'],
        account: this.SIDE_PANEL_LIST['ACCOUNT'],
        teachers: this.SIDE_PANEL_LIST['TEACHERS_LISTING'],
        students: this.SIDE_PANEL_LIST['STUDENTS_LISTING'],
        approval: this.SIDE_PANEL_LIST['TEACHER_APPROVAL'],
        'approval-pending': this.SIDE_PANEL_LIST['APPROVAL_PENDING'],
        'assign-teacher': this.SIDE_PANEL_LIST['ASSIGN_TEACHER'],
        assessment: this.SIDE_PANEL_LIST['ASSESMENT'],
      };
      const panel = panelMap[routePath] || '';
      if (panel) {
        this.activePanel = panel;
        this.dashboardService.setSidePanelChangeValue(panel);
      }
    }
  }

  btnMobileMenu() {
    this.isMobileNav = !this.isMobileNav;
  }
}
