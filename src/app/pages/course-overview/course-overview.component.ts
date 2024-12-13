import { Component, ViewChild, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AsyncPipe, CommonModule } from '@angular/common';
import { CommonSliderComponent } from 'src/app/components/common-slider/common-slider.component';
import { of, Subscription } from 'rxjs';
import { CoursesService } from '../courses/courses.service';
import { CourseUploadService } from '../course-upload/course-upload.service';
import { ICourseList } from '../courses/modal/course-list';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { CourseDetailsService } from '../course-details/course-details.service';
import { CommonSearchProfileComponent } from 'src/app/components/common-search-profile/common-search-profile.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-course-overview',
  standalone: true,
  imports: [FormsModule, CommonModule, CommonSliderComponent, AsyncPipe, CommonSearchProfileComponent],
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
  private onlineStatusSubscription: Subscription | undefined;  // Mark as possibly undefined
  public teachersList: any[] = [];
  public studentsList: any[] = [];
  @ViewChild('btnTrigger', { static: true }) btnTrigger!: ElementRef<HTMLButtonElement>;
  constructor(
    private courseUploadService: CourseUploadService,
    private authService: AuthService,
    private commonService: CommonService,
    private dashboardService: DashboardService,
    private courseDetailsService: CourseDetailsService,
    private router: Router,
  ) {
    this.fetchCourseList();
    this.getTeachersList();
    this.getSturdentsList();
    this.profileUrl = this.commonService.loginedUserInfo.profileImage ?? '';
  }
  ngOnInit() {
    this.loginedUserPrivilege = this.commonService.loginedUserInfo.role ?? '';
    this.onlineStatusSubscription = this.commonService.onlineStatusChanged.subscribe(
      (status: boolean) => {
        this.isOnline = status;
      }
    );
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
      let completedLessonCount = 0;
      course.chapterDetails.forEach((chapterDetails,index) => {
        const chapterCompleted = chapterDetails.fileDetails.every((fileDetails) => {
         return this.courseDetailsService.courseStatusList.find(
           (courseStatus) => courseStatus.parentId === fileDetails._id && +courseStatus.percentage === 100
         );
        });
        if(chapterCompleted){
          completedLessonCount = ((completedLessonCount || 0) + 1);
        }
        if (index + 1 === course.chapterDetails.length) {
          course.chapterCompletedCount = completedLessonCount || 0;
        }
      })
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
  fetchDashboardOverview() {
    this.dashboardOverview = this.dashboardService.fetchUploadedCourses();
  }
  ngOnDestroy(): void {
    if (this.onlineStatusSubscription) {
      this.onlineStatusSubscription.unsubscribe();
    }
  }
  getTeachersList() {
    this.teachersList = this.commonService.allUsersList.filter((user) => user.role === 'teacher');
  }
  getSturdentsList() {
    this.studentsList = this.commonService.allUsersList.filter((user) => user.role === 'student');
  }
}
