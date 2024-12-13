import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DashboardService } from 'src/app/pages/dashboard/dashboard.service';
import { ISidepanel } from 'src/app/pages/dashboard/modal/dashboard-modal';

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
  constructor(private dashboardService: DashboardService) {
    this.activePanel = this.SIDE_PANEL_LIST['DASHBOARD_OVERVIEW'];
  }
  setActivePanel(activePanel: string) {
    this.activePanel = activePanel;
    this.dashboardService.setSidePanelChangeValue(activePanel);
  }
}
