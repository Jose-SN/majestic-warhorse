import { CommonModule, DatePipe } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CourseUploadService } from 'src/app/pages/course-upload/course-upload.service';
import { ICourseList } from 'src/app/pages/courses/modal/course-list';
import { DashboardService } from 'src/app/pages/dashboard/dashboard.service';
import { UserModel } from 'src/app/pages/login-page/model/user-model';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { FavoritesApiService } from 'src/app/services/api-service/favorites-api.service';
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
  public favoriteCourses: ICourseList[] = [];
  public favoriteSectionExpanded = true;
  public loginedUserInfo: UserModel = {} as UserModel;
  public refreshTime: string = '';
  public activeFilterTab: string = 'All';
  filterList: string[] = ['All', 'New', 'Pending', 'Completed'];
  public readingFiles: any[] = [];
  private destroy$ = new Subject<void>();
  public loginedUserPrivilege: string = '';
  public dashboardOverview: any = {
    coursesUploaded: 0,
  };
  @ViewChild('btnTrigger', { static: true }) btnTrigger!: ElementRef<HTMLButtonElement>;
  constructor(
    private courseUploadService: CourseUploadService,
    private authService: AuthService,
    public commonService: CommonService,
    public dashboardService: DashboardService,
    private datePipe: DatePipe,
    private courseDetailsService: CourseDetailsService,
    private favoritesApiService: FavoritesApiService,
    private router: Router
  ) {}
  async ngOnInit(): Promise<void> {
    this.loginedUserPrivilege = this.commonService.loginedUserInfo?.role || '';
    await this.fetchDashboardOverview();
    await this.courseDetailsService.getCourseStatusList();
    this.fetchCourseList();
    this.fetchFavoriteCourses();
    this.fetchReadingFiles();
    this.loginedUserInfo = this.commonService.loginedUserInfo ?? {};
    this.loginedUserInfo.profileImage = this.commonService.decodeUrl(
      (this.loginedUserInfo.profileImage || this.loginedUserInfo.profile_image) ?? ''
    );
    this.getCurrentTime();
  }
  fetchFavoriteCourses(): void {
    const userId = this.commonService.loginedUserInfo?.id;
    if (!userId) return;

    this.favoritesApiService
      .getFavorites(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (response: any) => {
          const data = response?.data ?? response;
          const favorites = Array.isArray(data) ? data : [];
          const favoriteIds = new Set(
            favorites.map((f: any) => f.courseId ?? f.course_id).filter(Boolean)
          );
          if (favoriteIds.size === 0) {
            this.favoriteCourses = [];
            return;
          }
          try {
            const allCourses = await this.courseUploadService.fetchUploadedCourses();
            this.favoriteCourses = allCourses.filter((c) => favoriteIds.has(c.id));
            this.favoriteCourses.forEach((course) => {
              let averageRating = 0;
              let completedLessonCount = 0;
              course.chapterDetails?.forEach((chapterDetails: any, index: number) => {
                const chapterCompleted = chapterDetails.fileDetails?.every((fileDetails: any) =>
                  this.courseDetailsService.courseStatusList.find(
                    (cs) => cs.parentId === fileDetails.id && +cs.percentage === 100
                  )
                );
                const rating = chapterDetails.fileDetails?.reduce((acc: number, current: any) => {
                  const selectedRating = this.courseDetailsService.courseStatusList.find(
                    (cs) =>
                      cs.createdBy === this.commonService.loginedUserInfo.id &&
                      cs.parentId === current.parentId
                  );
                  return selectedRating?.rating || acc;
                }, 0);
                if (rating) {
                  averageRating += Math.round((rating / (chapterDetails.fileDetails?.length || 1)) * 100) / 100;
                }
                if (chapterCompleted) completedLessonCount++;
                if (index + 1 === (course.chapterDetails?.length || 0)) {
                  course.chapterCompletedCount = completedLessonCount;
                  course.completionPercent = `${((completedLessonCount / (course.chapterDetails?.length || 1)) * 100)}%`;
                  course.averageRating = averageRating;
                }
              });
            });
          } catch {
            this.favoriteCourses = [];
          }
        },
        error: () => {
          this.favoriteCourses = [];
        },
      });
  }

  toggleFavoriteSection(): void {
    this.favoriteSectionExpanded = !this.favoriteSectionExpanded;
  }

  navigateToFavorites(): void {
    this.router.navigate(['/dashboard/courses']);
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
    // this.favoriteCourses = this.courseLists;
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
  async fetchDashboardOverview() {
    this.dashboardOverview = await this.dashboardService.fetchUploadedCourseCount();
  }

  hasDashboardData(): boolean {
    return this.dashboardOverview && Object.keys(this.dashboardOverview).length > 0;
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
    // const panelMap: Record<string, string> = {
    //   '/dashboard/teachers': this.dashboardService.SIDE_PANEL_LIST.TEACHERS_LISTING,
    //   '/dashboard/students': this.dashboardService.SIDE_PANEL_LIST.STUDENTS_LISTING,
    //   '/dashboard/courses': this.dashboardService.SIDE_PANEL_LIST.COURSE_LISTING,
    // };
    // const panel = panelMap[route];
    // if (panel) {
    //   this.dashboardService.setSidePanelChangeValue(panel);
    // }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
