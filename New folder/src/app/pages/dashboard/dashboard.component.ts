import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { RegistrationPageComponent } from '../registration-page/registration-page.component';
import { CourseUploadComponent } from '../course-upload/course-upload.component';
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
    RegistrationPageComponent,
    CourseUploadComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  public activePanel: string = '';
  private destroy$ = new Subject<void>();
  public SIDE_PANEL_LIST: ISidepanel = this.dashboardService.SIDE_PANEL_LIST;
  constructor(
    private dashboardService: DashboardService,
    private commonService: CommonService
  ) {
    this.activePanel = this.SIDE_PANEL_LIST['DASHBOARD_OVERVIEW'];
  }
  get isAdminLogin() {
    console.log(this.commonService?.loginedUserInfo?.role, this.commonService.adminRoleType);
    return this.commonService?.loginedUserInfo?.role === this.commonService.adminRoleType;
  }
  ngOnInit(): void {
    this.dashboardService.getAllUsers();
    this.dashboardService
      .getSidePanelChange()
      .pipe(takeUntil(this.destroy$))
      .subscribe((activePanel: string) => {
        this.activePanel = activePanel;
      });
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
