import { Component, ViewChild, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AsyncPipe, CommonModule } from '@angular/common';
import { CommonSliderComponent } from 'src/app/components/common-slider/common-slider.component';
import { of, Subject, Subscription, takeUntil } from 'rxjs';
import { CoursesService } from '../courses/courses.service';
import { CourseUploadService } from '../course-upload/course-upload.service';
import { ICourseList } from '../courses/modal/course-list';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { CourseDetailsService } from '../course-details/course-details.service';
import { Router } from '@angular/router';
import { UserModel } from '../login-page/model/user-model';
import { CommonSearchProfileComponent } from 'src/app/components/common-search-profile/common-search-profile.component';
import { SearchFilterPipe } from 'src/app/shared/pipes/search-filter.pipe';
import { StarRatingModule } from 'angular-star-rating';

@Component({
  selector: 'app-course-overview',
  standalone: true,
  imports: [FormsModule, CommonModule, CommonSearchProfileComponent,
    SearchFilterPipe,StarRatingModule
  ],
  templateUrl: './course-overview.component.html',
  styleUrl: './course-overview.component.scss',
})
export class CourseOverviewComponent implements OnInit, OnDestroy {
  public mobMenu: boolean = false;
  public profileUrl: string = '';
  public showSliderView: boolean = false;
  public courseLists: ICourseList[] = [];
  public loginedUserPrivilege: string = '';
  public dashboardOverview: any = {
    coursesUploaded: 0,
  };
  public isOnline: boolean = navigator.onLine;
  public teachersList: UserModel[] = [];
  public studentsList: UserModel[] = [];
  private destroy$ = new Subject<void>();
  public searchText: string = '';
  @ViewChild('btnTrigger', { static: true }) btnTrigger!: ElementRef<HTMLButtonElement>;
  constructor(
    private courseUploadService: CourseUploadService,
    private authService: AuthService,
    public commonService: CommonService,
    private dashboardService: DashboardService,
    private courseDetailsService: CourseDetailsService
  ) {
    this.fetchCourseList();
    this.fetchDashboardOverview();
    this.profileUrl = this.commonService.decodeUrl(this.commonService.loginedUserInfo.profileImage ?? '')
  }
  async ngOnInit() {
    this.loginedUserPrivilege = this.commonService.loginedUserInfo.role ?? '';
    this.commonService.onlineStatusChanged
      .pipe(takeUntil(this.destroy$))
      .subscribe((status: boolean) => {
        this.isOnline = status;
      });
    this.commonService.alluserList = await this.authService.getAllUsers();
    if (this.commonService?.allUsersList.length) {
      this.commonService.allUsersList.forEach((user) => {
        switch (user.role) {
          case 'teacher':
            this.teachersList = this.teachersList.concat(user);
            break;
          case 'student':
            this.studentsList = this.studentsList.concat(user);
            break;
        }
      });
    }
  }
  triggerMenu() {
    this.btnTrigger.nativeElement.click();
    this.mobMenu = false;
  }
  mobileMenu() {
    this.mobMenu = !this.mobMenu;
  }
  openCourseUploadSlider() {
    this.showSliderView = !this.showSliderView;
  }
  sliderActiveRemove(): void {
    this.showSliderView = false;
  }
  async fetchCourseList() {
    await this.courseDetailsService.getCourseStatusList();
    this.courseLists = await this.courseUploadService.fetchUploadedCourses();
    this.courseLists.forEach((course) => {
      let averageRating = 0;
      let completedLessonCount = 0;
      course.chapterDetails.forEach((chapterDetails, index) => {
        const chapterCompleted = chapterDetails.fileDetails.every((fileDetails) => {
          return this.courseDetailsService.courseStatusList.find(
            (courseStatus) =>
              courseStatus.parentId === fileDetails._id && +courseStatus.percentage === 100
          );
        });
        const rating = chapterDetails.fileDetails.reduce((accumulator,current) => {
          let selectedRating = this.courseDetailsService.courseStatusList.find((courseStatus) =>
            courseStatus.createdBy === this.commonService.loginedUserInfo.id &&
          courseStatus.parentId === current.parentId);
          accumulator = selectedRating?.rating || accumulator;
          return accumulator
        },0);
        if(rating){
          averageRating = averageRating + Math.round(rating/chapterDetails.fileDetails.length * 100) / 100;
        }
        if (chapterCompleted) {
          completedLessonCount = (completedLessonCount || 0) + 1;
        }
        if (index + 1 === course.chapterDetails.length) {
          course.chapterCompletedCount = completedLessonCount || 0;
          course.completionPercent =  `${(completedLessonCount/course.chapterDetails.length)*100}%`;
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
  async fetchDashboardOverview() {
    this.dashboardOverview = await this.dashboardService.fetchUploadedCourseCount();
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  seachTextHandler(searchText: string) {
    this.searchText = searchText;
  }
}
