import { Injectable } from '@angular/core';
import { ISidepanel } from './modal/dashboard-modal';
import { BehaviorSubject, catchError, lastValueFrom, Observable, Subject } from 'rxjs';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { ICourseList } from '../courses/modal/course-list';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

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
    TEACHERS_LISTING: 'TEACHERS_LISTING',
    STUDENTS_LISTING: 'STUDENTS_LISTING',
    ASSIGN_TEACHER: 'ASSIGN_TEACHER',
  };
  public sidePanelChange: BehaviorSubject<string> = new BehaviorSubject(
    this.SIDE_PANEL_LIST.DASHBOARD_OVERVIEW
  );
  public courseDetailsInfo: Subject<{ [key: string]: boolean | ICourseList }> = new Subject();
  private _apiUrl: string = environment.majesticWarhorseApi;
  constructor(
    private authService: AuthService,
    private commonService: CommonService,
    private http: HttpClient,
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
  setCourseDetailsInfo(courseInfo: { [key: string]: boolean | ICourseList }) {
    this.courseDetailsInfo.next(courseInfo);
  }
  getCourseDetailsInfo() {
    return this.courseDetailsInfo.asObservable();
  }
  fetchUploadedCourses() {
    let role = this.commonService.loginedUserInfo.role;
    let queryParam = role === 'admin' ? `isAdmin=true` : role === 'teacher' ? `isTeacher=true` : 'isStudent=true';
    return lastValueFrom(
      this.http
        .get<
          any
        >(`${this._apiUrl}dashboard/get?${queryParam}`)
        .pipe(catchError(this.commonService.handleError))
    );
  }
}
