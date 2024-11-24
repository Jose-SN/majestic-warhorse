import { Component, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AsyncPipe, CommonModule } from '@angular/common';
import { CommonSliderComponent } from 'src/app/components/common-slider/common-slider.component';
import { of } from 'rxjs';
import { CoursesService } from '../courses/courses.service';
import { CourseUploadService } from '../course-upload/course-upload.service';
import { ICourseList } from '../courses/modal/course-list';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { CourseDetailsService } from '../course-details/course-details.service';

@Component({
  selector: 'app-course-overview',
  standalone: true,
  imports: [FormsModule, CommonModule, CommonSliderComponent, AsyncPipe],
  templateUrl: './course-overview.component.html',
  styleUrl: './course-overview.component.scss',
})
export class CourseOverviewComponent {
  public mobMenu: boolean = false;
  public profileUrl: string = '';
  public showSliderView: boolean = false;
  public courseLists: ICourseList[] = [];
  public loginedUserPrivilege: string = '';
  @ViewChild('btnTrigger', { static: true }) btnTrigger!: ElementRef<HTMLButtonElement>;
  constructor(
    private courseUploadService: CourseUploadService,
    private authService: AuthService,
    private commonService: CommonService,
    private dashboardService: DashboardService,
    private courseDetailsService: CourseDetailsService
  ) {
    this.fetchCourseList();
    this.profileUrl = this.commonService.loginedUserInfo.profileImage ?? '';
  }
  async ngOnInit() {
      this.loginedUserPrivilege = this.commonService.loginedUserInfo.role ?? '';
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
      course.chapterDetails.forEach((chapterDetails,index) => {
        const chapterCompleted = chapterDetails.fileDetails.every((fileDetails) => {
         const courseStarted = this.courseDetailsService.courseStatusList.find(
           (courseStatus) => courseStatus.parentId === fileDetails._id && +courseStatus.percentage === 100
         );
         return courseStarted
        });
        if(chapterCompleted){
          chapterDetails.completedCount = ((chapterDetails.completedCount || 0) + 1);
        }
        if (index + 1 === course.chapterDetails.length) {
          course.chapterCompletedCount = chapterDetails.completedCount || 0;
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
}
