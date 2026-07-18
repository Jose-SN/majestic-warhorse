import { Component, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CoursesService } from './courses.service';
import { Subject, takeUntil } from 'rxjs';
import { ICourseList } from './modal/course-list';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { SearchFilterPipe } from 'src/app/shared/pipes/search-filter.pipe';
import { CourseDetailsService } from '../course-details/course-details.service';
import { StarRatingModule } from 'angular-star-rating';
import { DASHBOARD_NAV_ROUTES } from '../dashboard/dashboard-routes.config';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [FormsModule, CommonModule, SearchFilterPipe, StarRatingModule],
  templateUrl: './courses.component.html',
  styleUrl: './courses.component.scss',
})
export class CoursesComponent {
  public profileUrl: string = '';
  public mobMenu: boolean = false;
  public courseList: ICourseList[] = [];
  public coursesLoading = true;
  public activeFilterTab: string = 'All';
  public searchText: string = '';
  public loginedUserPrivilege: string = '';
  private destroy$ = new Subject<void>();
  filterList: string[] = ['All', 'New', 'Progress', 'Completed'];
  @ViewChild('btnTrigger', { static: true }) btnTrigger!: ElementRef<HTMLButtonElement>;
  constructor(
    private coursesService: CoursesService,
    private authService: AuthService,
    private commonService: CommonService,
    private dashboardService: DashboardService,
    private courseDetailsService: CourseDetailsService,
    private router: Router
  ) {
    this.profileUrl = this.commonService.decodeUrl(
      (this.commonService.loginedUserInfo.profileImage || this.commonService.loginedUserInfo.profile_image) ?? ''
    );
  }
  async ngOnInit(): Promise<void> {
    this.loginedUserPrivilege = this.commonService.loginedUserInfo?.role || '';
    await this.courseDetailsService.getCourseStatusList(
      this.courseDetailsService.getOrganizationStatusQuery()
    );
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
  navigateToCourseUpload(): void {
    void this.router.navigate([DASHBOARD_NAV_ROUTES.courseUpload]);
  }

  openEditCourse(course: ICourseList, event: Event): void {
    event.stopPropagation();
    void this.router.navigate([DASHBOARD_NAV_ROUTES.courseUpload], {
      queryParams: { courseId: course.id },
    });
  }
  setActiveFilterTab(filter: string) {
    this.activeFilterTab = filter;
    // filter the course list
  }
  trackByIndex(index: number, item: any): number {
    return index;
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  fetchCourseList() {
    this.coursesLoading = true;
    this.coursesService
      .getCourseList()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (courses) => {
          this.courseList = courses;
          this.coursesLoading = false;
        },
        error: () => {
          this.courseList = [];
          this.coursesLoading = false;
        },
      });
  }
}
