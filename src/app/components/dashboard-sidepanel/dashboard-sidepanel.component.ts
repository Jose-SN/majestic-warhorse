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
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  setActivePanel(activePanel: string) {
    this.activePanel = activePanel;
    this.dashboardService.setSidePanelChangeValue(activePanel);
  }
  navigateToHome() {
    this.setActivePanel(this.SIDE_PANEL_LIST['DASHBOARD_OVERVIEW']);
  }
}
