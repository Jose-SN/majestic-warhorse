import { Component, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CoursesService } from './courses.service';
import { Observable, of, Subject, takeUntil } from 'rxjs';
import { ICourseList } from './modal/course-list';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { CommonSliderComponent } from 'src/app/components/common-slider/common-slider.component';
import { DashboardService } from '../dashboard/dashboard.service';
import { CommonSearchProfileComponent } from 'src/app/components/common-search-profile/common-search-profile.component';
import { SearchFilterPipe } from 'src/app/shared/pipes/search-filter.pipe';
import { CourseDetailsService } from '../course-details/course-details.service';
import { StarRatingModule } from 'angular-star-rating';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    CommonSliderComponent,
    CommonSearchProfileComponent,
    SearchFilterPipe,
    StarRatingModule,
  ],
  templateUrl: './courses.component.html',
  styleUrl: './courses.component.scss',
})
export class CoursesComponent {
  public profileUrl: string = '';
  public mobMenu: boolean = false;
  public showSliderView: boolean = false;
  public courseList$: Observable<ICourseList[]> = of([]);
  public activeFilterTab: string = 'All';
  public searchText: string = '';
  public loginedUserPrivilege: string = '';
  private destroy$ = new Subject<void>();
  filterList: string[] = ['All', 'New', 'Pending', 'Completed'];
  @ViewChild('btnTrigger', { static: true }) btnTrigger!: ElementRef<HTMLButtonElement>;
  constructor(
    private coursesService: CoursesService,
    private authService: AuthService,
    private commonService: CommonService,
    private dashboardService: DashboardService,
    private courseDetailsService: CourseDetailsService
  ) {
    this.profileUrl = this.commonService.decodeUrl(
      (this.commonService.loginedUserInfo.profileImage || this.commonService.loginedUserInfo.profile_image) ?? ''
    );
  }
  async ngOnInit(): Promise<void> {
    this.loginedUserPrivilege = this.commonService.loginedUserInfo.role ?? '';
    await this.courseDetailsService.getCourseStatusList();
    this.commonService
      .getCommonSearchText()
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchText) => {
        this.searchText = searchText;
      });
    this.fetchCourseList();
  }
  triggerMenu() {
    this.btnTrigger.nativeElement.click();
    this.mobMenu = false;
  }
  mobileMenu() {
    this.mobMenu = !this.mobMenu;
  }
  openCourseDetailsPage(selectedCourse: ICourseList) {
    this.dashboardService.setCourseDetailsInfo({
      selectedCourse: selectedCourse,
      showCourseDetail: true,
    });
  }
  logOut() {
    this.authService.logOutApplication();
  }
  sliderActiveRemove(): void {
    this.showSliderView = false;
    this.fetchCourseList();
  }
  setActiveFilterTab(filter: string) {
    this.activeFilterTab = filter;
    // filter the course list
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  fetchCourseList() {
    this.courseList$ = this.coursesService.getCourseList();
  }
}
