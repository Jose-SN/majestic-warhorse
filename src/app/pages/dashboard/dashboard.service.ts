import { Injectable } from '@angular/core';
import { ISidepanel } from './modal/dashboard-modal';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { CommonService } from 'src/app/shared/services/common.service';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  public SIDE_PANEL_LIST: ISidepanel = {
    CPD: 'CPD',
    ACCOUNT: 'ACCOUNT',
    SETTINGS: 'SETTINGS',
    COURSE_LISTING: 'COURSE_LISTING',
    LEADERSHIP_BOARD: 'LEADERSHIP_BOARD',
    DASHBOARD_OVERVIEW: 'DASHBOARD_OVERVIEW',
  };
  public sidePanelChange: BehaviorSubject<string> = new BehaviorSubject(
    this.SIDE_PANEL_LIST.DASHBOARD_OVERVIEW
  );
  constructor(
    private authService: AuthService,
    private commonService: CommonService
  ) {}
  async getAllUsers() {
    this.commonService.alluserList = await this.authService.getAllUsers();
  }
  setSidePanelChangeValue(changedpanel: string) {
    this.sidePanelChange.next(changedpanel);
  }
  getSidePanelChange(): Observable<string> {
    return this.sidePanelChange.asObservable();
  }
}
