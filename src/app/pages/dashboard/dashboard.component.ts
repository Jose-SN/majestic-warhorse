import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute, NavigationEnd } from '@angular/router';
import { DashboardSidepanelComponent } from 'src/app/components/dashboard-sidepanel/dashboard-sidepanel.component';
import { DashboardService } from './dashboard.service';
import { ISidepanel } from './modal/dashboard-modal';
import { Subject, takeUntil, filter } from 'rxjs';
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
  public SIDE_PANEL_LIST: ISidepanel = this.dashboardService.SIDE_PANEL_LIST;
  private destroy$ = new Subject<void>();

  constructor(
    private dashboardService: DashboardService,
    private commonService: CommonService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Listen to route changes and update side panel
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.updateActivePanelFromRoute();
      });

    // Initial route check
    this.updateActivePanelFromRoute();

    // Handle initial redirects based on user status
    const loginedUserData = this.commonService.loginedUserInfo;
    if (loginedUserData?.role === 'student' && !loginedUserData.assignedTo?.length) {
      this.router.navigate(['/dashboard/approval-pending'], { 
        state: { 
          infoMessage: 'You have not been assigned any teachers to view this course. Please contact the admin for assistance' 
        } 
      });
    } else if (loginedUserData?.role === 'teacher' && loginedUserData.status === 'pending') {
      this.router.navigate(['/dashboard/approval-pending'], { 
        state: { 
          infoMessage: 'Your request is pending approval from the admin. Please reach out to the admin for assistance.' 
        } 
      });
    } else {
      // Redirect to overview if no route matches
      const currentUrl = this.router.url;
      if (currentUrl === '/dashboard' || currentUrl === '/dashboard/') {
        const isAdmin = this.commonService.adminRoleType.includes(loginedUserData?.role ?? '');
        const defaultRoute = isAdmin ? '/dashboard/course-overview' : '/dashboard/overview';
        this.router.navigate([defaultRoute]);
      }
    }

    // Listen to course details navigation
    this.dashboardService
      .getCourseDetailsInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe((courseInfo: { [key: string]: boolean | any }) => {
        if (courseInfo['showCourseDetail']) {
          this.router.navigate(['/dashboard/course-details'], {
            state: { selectedCourse: courseInfo['selectedCourse'] }
          });
        } else {
          this.router.navigate(['/dashboard/courses']);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateActivePanelFromRoute() {
    const route = this.activatedRoute.firstChild;
    if (route) {
      const routePath = route.snapshot.routeConfig?.path || '';
      const panelMap: { [key: string]: string } = {
        'overview': this.SIDE_PANEL_LIST['DASHBOARD_OVERVIEW'],
        'course-overview': this.SIDE_PANEL_LIST['DASHBOARD_OVERVIEW'],
        'courses': this.SIDE_PANEL_LIST['COURSE_LISTING'],
        'course-details': this.SIDE_PANEL_LIST['COURSE_LISTING'],
        'account': this.SIDE_PANEL_LIST['ACCOUNT'],
        'teachers': this.SIDE_PANEL_LIST['TEACHERS_LISTING'],
        'students': this.SIDE_PANEL_LIST['STUDENTS_LISTING'],
        'approval': this.SIDE_PANEL_LIST['TEACHER_APPROVAL'],
        'approval-pending': this.SIDE_PANEL_LIST['APPROVAL_PENDING'],
        'assign-teacher': this.SIDE_PANEL_LIST['ASSIGN_TEACHER'],
        'assessment': this.SIDE_PANEL_LIST['ASSESMENT'],
      };
      const activePanel = panelMap[routePath] || '';
      if (activePanel) {
        this.dashboardService.setSidePanelChangeValue(activePanel);
      }
    } else {
      // If no child route, check current URL
      const currentUrl = this.router.url;
      const urlParts = currentUrl.split('/');
      const routePath = urlParts[urlParts.length - 1] || '';
      const panelMap: { [key: string]: string } = {
        'overview': this.SIDE_PANEL_LIST['DASHBOARD_OVERVIEW'],
        'course-overview': this.SIDE_PANEL_LIST['DASHBOARD_OVERVIEW'],
        'courses': this.SIDE_PANEL_LIST['COURSE_LISTING'],
        'course-details': this.SIDE_PANEL_LIST['COURSE_LISTING'],
        'account': this.SIDE_PANEL_LIST['ACCOUNT'],
        'teachers': this.SIDE_PANEL_LIST['TEACHERS_LISTING'],
        'students': this.SIDE_PANEL_LIST['STUDENTS_LISTING'],
        'approval': this.SIDE_PANEL_LIST['TEACHER_APPROVAL'],
        'approval-pending': this.SIDE_PANEL_LIST['APPROVAL_PENDING'],
        'assign-teacher': this.SIDE_PANEL_LIST['ASSIGN_TEACHER'],
        'assessment': this.SIDE_PANEL_LIST['ASSESMENT'],
      };
      const activePanel = panelMap[routePath] || '';
      if (activePanel) {
        this.dashboardService.setSidePanelChangeValue(activePanel);
      }
    }
  }

  btnMobileMenu() {
    this.isMobileNav = !this.isMobileNav;
  }
}
