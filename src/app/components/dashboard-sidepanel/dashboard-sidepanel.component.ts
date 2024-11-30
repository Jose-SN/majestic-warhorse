import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DashboardService } from 'src/app/pages/dashboard/dashboard.service';
import { ISidepanel } from 'src/app/pages/dashboard/modal/dashboard-modal';
import { AppService } from 'src/app/shared/services/app.service';
import { CommonService } from 'src/app/shared/services/common.service';

@Component({
  selector: 'app-dashboard-sidepanel',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './dashboard-sidepanel.component.html',
  styleUrl: './dashboard-sidepanel.component.scss',
})
export class DashboardSidepanelComponent {
  public mobMenu: boolean = false;
  public activePanel: string = '';
  public SIDE_PANEL_LIST: ISidepanel = this.dashboardService.SIDE_PANEL_LIST;
  public loginedUserPrivilege: string = '';
  public currentYear: number = new Date().getFullYear();
  constructor(
    private dashboardService: DashboardService, 
    public commonService: CommonService, 
    private router: Router,
    public appService: AppService,
  ) {
    this.activePanel = this.SIDE_PANEL_LIST['DASHBOARD_OVERVIEW'];
    this.loginedUserPrivilege = this.commonService.loginedUserInfo.role ?? '';
  }
  setActivePanel(activePanel: string) {
    this.activePanel = activePanel;
    this.dashboardService.setSidePanelChangeValue(activePanel);
  }
  navigateToHome() {
    this.setActivePanel(this.SIDE_PANEL_LIST['DASHBOARD_OVERVIEW']);
  }
}
