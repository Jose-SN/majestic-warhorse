import { CommonModule, DatePipe } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CourseUploadService } from 'src/app/pages/course-upload/course-upload.service';
import { ICourseList } from 'src/app/pages/courses/modal/course-list';
import { DashboardService } from 'src/app/pages/dashboard/dashboard.service';
import { UserModel } from 'src/app/pages/login-page/model/user-model';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { CourseDetailsService } from 'src/app/pages/course-details/course-details.service';
import { StarRatingModule } from 'angular-star-rating';
@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    StarRatingModule,
  ],
  templateUrl: './dashboard-overview.component.html',
  styleUrl: './dashboard-overview.component.scss',
})
export class DashboardOverviewComponent {
  public isMobileNav = false;
  public activePanel: string = '';
  public courseLists: ICourseList[] = [];
  public loginedUserInfo: UserModel = {} as UserModel;
  public refreshTime: string = '';
  public activeFilterTab: string = 'All';
  filterList: string[] = ['All', 'New', 'Pending', 'Completed'];
  public readingFiles: any[] = [];
  @ViewChild('btnTrigger', { static: true }) btnTrigger!: ElementRef<HTMLButtonElement>;
  constructor(
    private courseUploadService: CourseUploadService,
    private authService: AuthService,
    public commonService: CommonService,
    private dashboardService: DashboardService,
    private datePipe: DatePipe,
    private courseDetailsService: CourseDetailsService
  ) {}
  async ngOnInit(): Promise<void> {
    await this.courseDetailsService.getCourseStatusList();
    this.fetchCourseList();
    this.fetchReadingFiles();
    this.loginedUserInfo = this.commonService.loginedUserInfo ?? {};
    this.loginedUserInfo.profileImage = this.commonService.decodeUrl(
      (this.loginedUserInfo.profileImage || this.loginedUserInfo.profile_image) ?? ''
    );
    this.getCurrentTime();
  }
  async fetchReadingFiles() {
    // TODO: Replace with actual API call when endpoint is available
    // Example: this.readingFiles = await this.someService.getReadingFiles();
    // For now, initialize as empty array - will be populated from API
    this.readingFiles = [];
  }
  async fetchCourseList() {
    this.courseLists = await this.courseUploadService.fetchUploadedCourses();
    this.courseLists.forEach((course) => {
      let averageRating = 0;
      let completedLessonCount = 0;
      course.chapterDetails.forEach((chapterDetails, index) => {
        const chapterCompleted = chapterDetails.fileDetails.every((fileDetails) => {
          return this.courseDetailsService.courseStatusList.find(
            (courseStatus) =>
              courseStatus.parentId === fileDetails.id && +courseStatus.percentage === 100
          );
        });
        const rating = chapterDetails.fileDetails.reduce((accumulator, current) => {
          let selectedRating = this.courseDetailsService.courseStatusList.find(
            (courseStatus) =>
              courseStatus.createdBy === this.commonService.loginedUserInfo.id &&
              courseStatus.parentId === current.parentId
          );
          accumulator = selectedRating?.rating || accumulator;
          return accumulator;
        }, 0);
        if (rating) {
          averageRating =
            averageRating + Math.round((rating / chapterDetails.fileDetails.length) * 100) / 100;
        }
        if (chapterCompleted) {
          completedLessonCount = (completedLessonCount || 0) + 1;
        }
        if (index + 1 === course.chapterDetails.length) {
          course.chapterCompletedCount = completedLessonCount || 0;
          course.completionPercent = `${(completedLessonCount / course.chapterDetails.length) * 100}%`;
          course.averageRating = averageRating;
        }
      });
    });
  }
  logOut() {
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
  trackByIndex(index: number): number {
    return index;
  }
  btnMobileMenu() {
    this.isMobileNav = !this.isMobileNav;
  }
}
