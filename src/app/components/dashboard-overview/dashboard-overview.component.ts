import { CommonModule, DatePipe } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CourseUploadService } from 'src/app/pages/course-upload/course-upload.service';
import { ICourseList } from 'src/app/pages/courses/modal/course-list';
import { DashboardService } from 'src/app/pages/dashboard/dashboard.service';
import { UserModel } from 'src/app/pages/login-page/model/user-model';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { DashboardSidepanelComponent } from 'src/app/components/dashboard-sidepanel/dashboard-sidepanel.component';
import { CommonSearchProfileComponent } from 'src/app/components/common-search-profile/common-search-profile.component';
@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [FormsModule, CommonModule, CommonSearchProfileComponent, DashboardSidepanelComponent],
  templateUrl: './dashboard-overview.component.html',
  styleUrl: './dashboard-overview.component.scss',
})
export class DashboardOverviewComponent {
  public isMobileNav = false;
  public activePanel: string = '';
  public courseLists: ICourseList[] = [];
  public loginedUserInfo:UserModel = {} as UserModel;
  public refreshTime: string = '';
  public activeFilterTab: string = 'All';
  filterList: string[] = ['All', 'New', 'Pending', 'Completed'];
  @ViewChild('btnTrigger', { static: true }) btnTrigger!: ElementRef<HTMLButtonElement>;
  constructor(
    private courseUploadService: CourseUploadService,
    private authService:AuthService,
    public commonService: CommonService,
    private dashboardService: DashboardService,
    private datePipe: DatePipe
  ) {
    this.fetchCourseList();
    this.loginedUserInfo = this.commonService.loginedUserInfo ?? {};
    this.loginedUserInfo.profileImage = this.commonService.decodeUrl(this.loginedUserInfo.profileImage ?? '')
    this.getCurrentTime();
  }

  async fetchCourseList() {
    this.courseLists = await this.courseUploadService.fetchUploadedCourses();
  }
  logOut(){
    this.authService.logOutApplication();
  }
  openCourseDetailsPage(selectedCourse: ICourseList) {
    this.dashboardService.setCourseDetailsInfo({
      selectedCourse: selectedCourse,
      showCourseDetail: true,
    });
  }
  getCurrentTime() {
    const currentDate = new Date();
    const formattedDate = this.datePipe.transform(currentDate, 'MMMM dd, yyyy hh:mm a');
    this.refreshTime = formattedDate ?? '';
  }
  setActiveFilterTab(filter: string) {
    this.activeFilterTab = filter;
    // filter the course list
  }
  btnMobileMenu() {
    this.isMobileNav = !this.isMobileNav;
  }
}