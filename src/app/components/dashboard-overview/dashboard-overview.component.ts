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
import {
  DASHBOARD_DEMO_DATA,
  DashboardDemoViewModel,
  RecommendedCourseItem,
  SubscribedCourseItem,
} from './data/dashboard-demo.data';

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [FormsModule, CommonModule, StarRatingModule],
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
  public readingFiles: any[] = [];
  private destroy$ = new Subject<void>();
  public loginedUserPrivilege: string = '';

  /** Demo view model — replace mapping in mergeLiveData() when wiring APIs. */
  viewModel: DashboardDemoViewModel = structuredClone(DASHBOARD_DEMO_DATA);

  recommendationIndex = 0;
  readonly ringCircumference = 2 * Math.PI * 15;

  readonly chartYLabels = [
    { text: '100%', y: 18 },
    { text: '75%', y: 38 },
    { text: '50%', y: 58 },
    { text: '25%', y: 78 },
    { text: '0%', y: 98 },
  ];
  readonly chartDayLabels = [
    { label: 'Mon', x: 45 },
    { label: 'Tue', x: 82 },
    { label: 'Wed', x: 119 },
    { label: 'Thu', x: 156 },
    { label: 'Fri', x: 193 },
    { label: 'Sat', x: 230 },
    { label: 'Sun', x: 267 },
  ];

  public dashboardOverview: any = { coursesUploaded: 0 };

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
    this.viewModel = structuredClone(DASHBOARD_DEMO_DATA);
    this.activeFilterTab = this.viewModel.filterTabs[0];

    await this.fetchDashboardOverview();
    await this.courseDetailsService.getCourseStatusList();
    await this.fetchCourseList();
    this.fetchFavoriteCourses();
    this.fetchReadingFiles();
    this.loginedUserInfo = this.commonService.loginedUserInfo ?? {};
    this.loginedUserInfo.profileImage = this.commonService.decodeUrl(
      (this.loginedUserInfo.profileImage || this.loginedUserInfo.profile_image) ?? ''
    );
    this.mergeLiveData();
    this.getCurrentTime();
  }

  get recommendationsDisplay(): RecommendedCourseItem[] {
    const demo = DASHBOARD_DEMO_DATA.recommendations;
    return Array.from({ length: 4 }, (_, i) => {
      return this.viewModel.recommendations[i] ?? { ...demo[i] };
    });
  }

  get subscribedCoursesDisplay(): SubscribedCourseItem[] {
    const demo = DASHBOARD_DEMO_DATA.subscribedCourses;
    return Array.from({ length: 8 }, (_, i) => {
      return this.viewModel.subscribedCourses[i] ?? { ...demo[i] };
    });
  }

  get filterList(): string[] {
    return this.viewModel.filterTabs;
  }

  get activityFeedItems() {
    return this.viewModel.insights.activityFeed;
  }

  get dailyGoals() {
    return this.viewModel.insights.dailyGoals;
  }

  get userEmail(): string {
    return (
      this.loginedUserInfo.email ||
      this.loginedUserInfo.contact?.email ||
      this.viewModel.insights.hologramEmail
    );
  }

  /** Reference uses horse logo hologram, not profile photo. */
  get hologramImage(): string {
    return '../../../assets/images/logo-majestic-hourse.svg';
  }

  ringOffset(percent: number, radius = 15): number {
    const safe = Math.min(100, Math.max(0, percent));
    const circumference = 2 * Math.PI * radius;
    return circumference * (1 - safe / 100);
  }

  ringCircumferenceFor(radius: number): number {
    return 2 * Math.PI * radius;
  }

  barHeight(value: number, max = 100): number {
    return Math.max(8, Math.round((value / max) * 100));
  }

  slideRecommendations(direction: -1 | 1): void {
    const total = this.recommendationsDisplay.length;
    if (!total) return;
    this.recommendationIndex = (this.recommendationIndex + direction + total) % total;
  }

  goToRecommendation(index: number): void {
    this.recommendationIndex = index;
  }

  /** Map API courses into demo view model slots — extend when connecting real endpoints. */
  mergeLiveData(): void {
    if (!this.courseLists.length) {
      return;
    }

    const mapped = this.courseLists.map((course, index) =>
      this.mapCourseToSubscribedItem(course, index)
    );

    const demo = DASHBOARD_DEMO_DATA.subscribedCourses;
    this.viewModel.subscribedCourses = Array.from({ length: 8 }, (_, i) => {
      return mapped[i] ?? { ...demo[i % demo.length], id: demo[i % demo.length].id };
    });

    const demoRecs = DASHBOARD_DEMO_DATA.recommendations;
    this.viewModel.recommendations = Array.from({ length: 4 }, (_, i) => {
      const course = this.courseLists[i];
      const fallback = demoRecs[i];
      return {
        id: course?.id || fallback.id,
        title: 'Military Strategy Course',
        subtitle: fallback.subtitle,
        coverStyle: fallback.coverStyle,
      };
    });

    if (this.courseLists.some((c) => (c.chapterCompletedCount ?? 0) > 0)) {
      this.viewModel.insights.activityFeed = this.courseLists
        .filter((c) => (c.chapterCompletedCount ?? 0) > 0)
        .slice(0, 2)
        .map((c) => ({
          title: 'Recent course completion',
          subtitle: c.courseTitle || 'Recent Course & Goals',
        }));
      while (this.viewModel.insights.activityFeed.length < 2) {
        this.viewModel.insights.activityFeed.push({
          ...DASHBOARD_DEMO_DATA.insights.activityFeed[0],
        });
      }
    }

    const progress = this.courseLists.slice(0, 7).map((course) => {
      const parsed = parseInt(String(course.completionPercent || '0').replace('%', ''), 10);
      return Number.isFinite(parsed) ? Math.min(100, Math.max(5, parsed)) : 40;
    });
    if (progress.length) {
      while (progress.length < 7) {
        progress.push(progress[progress.length - 1] ?? 50);
      }
      this.viewModel.insights.weekProgress = progress.slice(0, 7);
    }
  }

  private mapCourseToSubscribedItem(course: ICourseList, index: number): SubscribedCourseItem {
    const demo = DASHBOARD_DEMO_DATA.subscribedCourses[index % 8];
    const parsed = parseInt(String(course.completionPercent || '0').replace('%', ''), 10);
    const completePercent =
      Number.isFinite(parsed) && parsed > 0 ? parsed : demo.completePercent;

    return {
      ...demo,
      id: course.id || demo.id,
      title: course.courseTitle || demo.title,
      featured: index === 0,
      imageUrl: index === 0 ? course.courseCoverImage : undefined,
      usePlaceholderIcon: index !== 0,
      completePercent,
    };
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
    this.readingFiles = [];
  }

  async fetchCourseList() {
    this.courseLists = await this.courseUploadService.fetchUploadedCourses();
    this.courseLists.forEach((course) => {
      let averageRating = 0;
      let completedLessonCount = 0;
      course.chapterDetails?.forEach((chapterDetails, index) => {
        const chapterCompleted = chapterDetails.fileDetails?.every((fileDetails) =>
          this.courseDetailsService.courseStatusList.find(
            (courseStatus) =>
              courseStatus.parentId === fileDetails.id && +courseStatus.percentage === 100
          )
        );
        const rating = chapterDetails.fileDetails?.reduce((accumulator, current) => {
          const selectedRating = this.courseDetailsService.courseStatusList.find(
            (courseStatus) =>
              courseStatus.createdBy === this.commonService.loginedUserInfo.id &&
              courseStatus.parentId === current.parentId
          );
          return selectedRating?.rating || accumulator;
        }, 0);
        if (rating) {
          averageRating =
            averageRating + Math.round(((rating || 0) / (chapterDetails.fileDetails?.length || 1)) * 100) / 100;
        }
        if (chapterCompleted) {
          completedLessonCount = (completedLessonCount || 0) + 1;
        }
        if (index + 1 === (course.chapterDetails?.length || 0)) {
          course.chapterCompletedCount = completedLessonCount || 0;
          course.completionPercent = `${((completedLessonCount / (course.chapterDetails?.length || 1)) * 100)}%`;
          course.averageRating = averageRating;
        }
      });
    });
    this.mergeLiveData();
  }

  openCourseDetailsPage(selectedCourse: ICourseList) {
    this.dashboardService.setCourseDetailsInfo({
      selectedCourse,
      showCourseDetail: true,
    });
  }

  openSubscribedCourse(item: SubscribedCourseItem) {
    const live = this.courseLists.find((c) => c.id === item.id);
    if (live) {
      this.openCourseDetailsPage(live);
    }
  }

  getCurrentTime() {
    const currentDate = new Date();
    this.refreshTime = this.datePipe.transform(currentDate, 'MMMM dd, yyyy hh:mm a') ?? '';
  }

  setActiveFilterTab(filter: string) {
    this.activeFilterTab = filter;
  }

  trackByIndex(index: number): number {
    return index;
  }

  btnMobileMenu() {
    this.isMobileNav = !this.isMobileNav;
  }

  async fetchDashboardOverview() {
    try {
      this.dashboardOverview = await this.dashboardService.fetchUploadedCourseCount();
    } catch {
      this.dashboardOverview = {};
    }
  }

  get chartLinePath(): string {
    return this.buildChartPath(this.viewModel.insights.weekProgress);
  }

  get chartSuggestedLinePath(): string {
    return this.buildChartPath(this.viewModel.insights.suggestedProgress);
  }

  private buildChartPath(values: number[]): string {
    const points = values.map((value, index) => {
      const x = 45 + index * 37;
      const y = 95 - (value / 100) * 85;
      return `${index === 0 ? 'M' : 'L'}${x},${y}`;
    });
    return points.join(' ');
  }

  get chartAreaPath(): string {
    const values = this.viewModel.insights.weekProgress;
    const linePoints = values.map((value, index) => {
      const x = 45 + index * 37;
      const y = 95 - (value / 100) * 85;
      return `${x},${y}`;
    });
    const lastX = 45 + (values.length - 1) * 37;
    return `M45,95 L${linePoints.join(' L')} L${lastX},95 Z`;
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
