import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { DashboardService } from 'src/app/pages/dashboard/dashboard.service';
import { ISidepanel } from 'src/app/pages/dashboard/modal/dashboard-modal';
import { AppService } from 'src/app/shared/services/app.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { ModalComponent } from '../modal/modal.component';
import { CommonDialogComponent } from '../common-dialog/common-dialog.component';
import { IModelInfo } from '../common-dialog/model/popupmodel';
import { AuthService } from 'src/app/services/api-service/auth.service';

@Component({
  selector: 'app-dashboard-sidepanel',
  standalone: true,
  imports: [FormsModule, CommonModule, ModalComponent, CommonDialogComponent],
  templateUrl: './dashboard-sidepanel.component.html',
  styleUrl: './dashboard-sidepanel.component.scss',
})
export class DashboardSidepanelComponent {
  public mobMenu: boolean = false;
  public activePanel: string = '';
  public SIDE_PANEL_LIST: ISidepanel = this.dashboardService.SIDE_PANEL_LIST;
  public loginedUserPrivilege: string = '';
  public currentYear: number = new Date().getFullYear();
  private destroy$ = new Subject<void>();
  public showAssigningPopup: boolean = false;
  public popupModelInfo: IModelInfo = {
    title: 'Assign Teacher',
    isDynamicContent: true,
    data: null,
  } as IModelInfo;
  public assignedTo: FormControl = new FormControl([]);
  constructor(
    private dashboardService: DashboardService,
    public commonService: CommonService,
    private router: Router,
    public appService: AppService,
    public authService: AuthService
  ) {
    this.activePanel = this.SIDE_PANEL_LIST['DASHBOARD_OVERVIEW'];
    this.loginedUserPrivilege = this.commonService.loginedUserInfo.role ?? '';
    this.dashboardService.sidePanelChange$.pipe(takeUntil(this.destroy$)).subscribe((activePanel: string) => {
      this.activePanel = activePanel;
    })
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  setActivePanel(activePanel: string) {
    if (this.disableListItems() && activePanel !== this.SIDE_PANEL_LIST['APPROVAL_PENDING']) return;
    
    const routeMap: { [key: string]: string } = {
      [this.SIDE_PANEL_LIST['DASHBOARD_OVERVIEW']]: '/dashboard/overview',
      [this.SIDE_PANEL_LIST['COURSE_LISTING']]: '/dashboard/courses',
      [this.SIDE_PANEL_LIST['ACCOUNT']]: '/dashboard/account',
      [this.SIDE_PANEL_LIST['TEACHERS_LISTING']]: '/dashboard/teachers',
      [this.SIDE_PANEL_LIST['STUDENTS_LISTING']]: '/dashboard/students',
      [this.SIDE_PANEL_LIST['TEACHER_APPROVAL']]: '/dashboard/approval',
      [this.SIDE_PANEL_LIST['APPROVAL_PENDING']]: '/dashboard/approval-pending',
      [this.SIDE_PANEL_LIST['ASSIGN_TEACHER']]: '/dashboard/assign-teacher',
      [this.SIDE_PANEL_LIST['ASSESMENT']]: '/dashboard/assessment',
    };

    const route = routeMap[activePanel];
    if (route) {
      this.router.navigate([route]);
      this.activePanel = activePanel;
      this.dashboardService.setSidePanelChangeValue(activePanel);
    }
  }
  navigateToHome() {
    if (this.disableListItems()) return;
    const defaultRoute = this.commonService.adminRoleType.includes(this.loginedUserPrivilege) 
      ? '/dashboard/course-overview' 
      : '/dashboard/overview';
    this.router.navigate([defaultRoute]);
  }
  disableListItems() {
    return this.loginedUserPrivilege === 'student' && this.commonService.loginedUserInfo.assignedTo?.length === 0 || 
      this.loginedUserPrivilege === 'teacher' && this.commonService.loginedUserInfo.status === 'pending';
  }
}
