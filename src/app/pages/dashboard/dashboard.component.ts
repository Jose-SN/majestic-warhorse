import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
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
    DashboardSidepanelComponent,
    CourseUploadComponent,
    CourseDetailsComponent,
    EditAccountComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  public activePanel: string = '';
  public showCourseDetailedView: boolean = false;
  public selectedCourseInfo: ICourseList = {} as ICourseList;
  private destroy$ = new Subject<void>();
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
    this.dashboardService.getAllUsers();
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
}
