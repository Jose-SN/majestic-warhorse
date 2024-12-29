import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DashboardSidepanelComponent } from 'src/app/components/dashboard-sidepanel/dashboard-sidepanel.component';
import { DashboardOverviewComponent } from 'src/app/components/dashboard-overview/dashboard-overview.component';
import { CoursesComponent } from '../courses/courses.component';
import { DashboardService } from './dashboard.service';
import { ISidepanel } from './modal/dashboard-modal';
import { Subject, takeUntil } from 'rxjs';
import { CourseOverviewComponent } from '../course-overview/course-overview.component';
import { CommonService } from 'src/app/shared/services/common.service';
import { UnderConstructionComponent } from 'src/app/components/under-construction/under-construction.component';
import { CourseUploadComponent } from '../course-upload/course-upload.component';
import { ICourseList } from '../courses/modal/course-list';
import { CourseDetailsComponent } from '../course-details/course-details.component';
import { EditAccountComponent } from '../edit-account/edit-account.component';
import { QuestionnaireComponent } from '../questionnaire/questionnaire.component';
import { TeachersListComponent } from '../teachers-list/teachers-list.component';
import { ApprovalListComponent } from '../approval-list/approval-list.component';
import { StudentsListComponent } from '../students-list/students-list.component';
import { AssignTeachersComponent } from 'src/app/components/assign-teachers/assign-teachers.component';
import { ApprovalPendingComponent } from '../approval-pending/approval-pending.component';
import { StudentTeacherAssignListComponent } from '../student-teacher-assign-list/student-teacher-assign-list.component';
import { OverlayComponent } from 'src/app/shared/overlay/overlay.component';
import { CommonSearchProfileComponent } from 'src/app/components/common-search-profile/common-search-profile.component';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    CoursesComponent,
    CourseOverviewComponent,
    DashboardOverviewComponent,
    UnderConstructionComponent,
    AssignTeachersComponent,
    DashboardSidepanelComponent,
    CourseDetailsComponent,
    EditAccountComponent,
    TeachersListComponent,
    ApprovalListComponent,
    StudentsListComponent,
    ApprovalPendingComponent,
    StudentTeacherAssignListComponent,
    OverlayComponent,
    CommonSearchProfileComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  public isMobileNav = false;
  public activePanel: string = '';
  public showCourseDetailedView: boolean = false;
  public selectedCourseInfo: ICourseList = {} as ICourseList;
  private destroy$ = new Subject<void>();
  public infoMessage: string = '';
  public SIDE_PANEL_LIST: ISidepanel = this.dashboardService.SIDE_PANEL_LIST;
  @ViewChild(DashboardSidepanelComponent) dashboardSidepanelComponent!: DashboardSidepanelComponent;
  constructor(
    private dashboardService: DashboardService,
    private commonService: CommonService
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
        this.selectedCourseInfo = {} as ICourseList;
        this.showCourseDetailedView = false;
      });
    this.dashboardService
      .getCourseDetailsInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe((courseInfo: { [key: string]: boolean | ICourseList }) => {
        this.handleCourseDetailsView(courseInfo);
      });
    const loginedUserData = this.commonService.loginedUserInfo;
    // if (loginedUserData?.role === 'student' && !loginedUserData.assignedTo?.length) {
    //   this.activePanel = this.SIDE_PANEL_LIST['APPROVAL_PENDING'];
    //   this.infoMessage =
    //     'You have not been assigned any teachers to view this course. Please contact the admin for assistance';
    // } else if ((loginedUserData?.role === 'teacher' && !loginedUserData.approved)) {
    //   this.activePanel = this.SIDE_PANEL_LIST['APPROVAL_PENDING'];
    //   this.infoMessage =
    //     'Your request is pending approval from the admin. Please reach out to the admin for assistance.';
    // }
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  handleCourseDetailsView(showCourseView: { [key: string]: boolean | ICourseList }) {
    this.activePanel = this.SIDE_PANEL_LIST['COURSE_LISTING'];
    this.dashboardSidepanelComponent.activePanel = this.activePanel;
    this.selectedCourseInfo = showCourseView['selectedCourse'] as ICourseList;
    this.showCourseDetailedView = showCourseView['showCourseDetail'] as boolean;
  }
  btnMobileMenu() {
    this.isMobileNav = !this.isMobileNav;
  }
}
