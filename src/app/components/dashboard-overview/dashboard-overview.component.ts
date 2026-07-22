import { CommonModule, DatePipe } from '@angular/common';
import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, skip, takeUntil } from 'rxjs';
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
  createEmptyDashboardViewModel,
  createEmptyStatWidgets,
  DASHBOARD_DEMO_DATA,
  DashboardDemoViewModel,
  RecommendedCourseItem,
  SubscribedCourseItem,
} from './data/dashboard-demo.data';
import { DemoModeService } from 'src/app/shared/services/demo-mode.service';

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [FormsModule, CommonModule, StarRatingModule],
  templateUrl: './dashboard-overview.component.html',
  styleUrl: './dashboard-overview.component.scss',
})
export class DashboardOverviewComponent implements OnDestroy {
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

  /** Dashboard view model — demo data only when demo mode is enabled. */
  viewModel: DashboardDemoViewModel = createEmptyDashboardViewModel();

  recommendationIndex = 0;
  carouselOffset = 0;
  readonly carouselPageSize = 4;
  readonly ringCircumference = 2 * Math.PI * 15;
  readonly brandLogo = 'assets/images/logo-majestic-hourse.svg';

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
  public coursesLoading = false;
  public coursesLoaded = false;
  public coursesContentLoading = false;
  public searchText = '';

  @ViewChild('btnTrigger', { static: true }) btnTrigger!: ElementRef<HTMLButtonElement>;
  @ViewChild('futuristicDashboard') futuristicDashboard?: ElementRef<HTMLElement>;

  constructor(
    private courseUploadService: CourseUploadService,
    private authService: AuthService,
    public commonService: CommonService,
    public dashboardService: DashboardService,
    private datePipe: DatePipe,
    private courseDetailsService: CourseDetailsService,
    private favoritesApiService: FavoritesApiService,
    private router: Router,
    private demoModeService: DemoModeService
  ) {}

  async ngOnInit(): Promise<void> {
    this.loginedUserPrivilege = this.commonService.loginedUserInfo?.role || '';
    this.activeFilterTab = this.viewModel.filterTabs[0];

    this.demoModeService.demoLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe((loading) => {
        if (loading) {
          this.viewModel = createEmptyDashboardViewModel();
          this.recommendationIndex = 0;
          this.carouselOffset = 0;
        }
      });

    this.demoModeService.demoMode$
      .pipe(skip(1), takeUntil(this.destroy$))
      .subscribe((isDemo) => {
        this.refreshDashboardView();
        if (!isDemo) {
          void this.fetchCourseList();
        } else {
          this.setCoursesContentLoading(false);
        }
      });

    this.commonService
      .getCommonSearchText()
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchText) => {
        this.searchText = searchText ?? '';
        this.recommendationIndex = 0;
        this.carouselOffset = 0;
      });

    if (!this.demoModeService.isDemoMode) {
      this.setCoursesContentLoading(true);
    }

    await this.fetchDashboardOverview();
    await this.courseDetailsService.getCourseStatusList(
      this.courseDetailsService.getOrganizationStatusQuery()
    );
    await this.fetchCourseList();
    this.fetchFavoriteCourses();
    this.fetchReadingFiles();
    this.loginedUserInfo = this.commonService.loginedUserInfo ?? {};
    this.loginedUserInfo.profileImage = this.commonService.decodeUrl(
      (this.loginedUserInfo.profileImage || this.loginedUserInfo.profile_image) ?? ''
    );
    this.getCurrentTime();
    this.refreshDashboardView();
  }

  private refreshDashboardView(): void {
    if (this.demoModeService.isDemoMode) {
      this.viewModel = structuredClone(DASHBOARD_DEMO_DATA);
      this.recommendationIndex = 0;
      this.carouselOffset = 0;
      this.commonService.setActivityFeed(this.viewModel.insights.activityFeed ?? []);
      return;
    }

    this.viewModel = createEmptyDashboardViewModel();
    this.activeFilterTab = this.viewModel.filterTabs[0];
    this.mergeLiveData();
  }

  get recommendationsDisplay(): RecommendedCourseItem[] {
    const all = this.viewModel.recommendations ?? [];
    return all.filter((item) =>
      this.matchesCourseSearch([item.title, item.subtitle, item.ctaLabel, item.id])
    );
  }

  get visibleRecommendations(): RecommendedCourseItem[] {
    const all = this.recommendationsDisplay;
    if (all.length <= this.carouselPageSize) {
      return all;
    }
    return all.slice(this.carouselOffset, this.carouselOffset + this.carouselPageSize);
  }

  get hasActiveCourseSearch(): boolean {
    return !!this.searchText?.trim();
  }

  get canSlideRecommendationsPrev(): boolean {
    return this.recommendationsDisplay.length > 1;
  }

  get canSlideRecommendationsNext(): boolean {
    return this.recommendationsDisplay.length > 1;
  }

  private get recommendationPageOffset(): number {
    const total = this.recommendationsDisplay.length;
    if (!total) {
      return 0;
    }
    return Math.floor(this.recommendationIndex / this.carouselPageSize) * this.carouselPageSize;
  }

  private syncCarouselOffsetToSelection(): void {
    const total = this.recommendationsDisplay.length;
    if (!total) {
      this.carouselOffset = 0;
      return;
    }
    const maxOffset = Math.max(0, Math.floor((total - 1) / this.carouselPageSize) * this.carouselPageSize);
    this.carouselOffset = Math.min(this.recommendationPageOffset, maxOffset);
  }

  get allSubscribedCourses(): SubscribedCourseItem[] {
    return this.viewModel.subscribedCourses ?? [];
  }

  get subscribedCoursesDisplay(): SubscribedCourseItem[] {
    const all = this.allSubscribedCourses;
    const active = this.normalizeFilterTab(this.activeFilterTab);
    const byStatus =
      !active || active === 'All'
        ? all
        : all.filter((course) => this.normalizeFilterTab(this.getSubscribedStatus(course)) === active);

    return byStatus.filter((course) =>
      this.matchesCourseSearch([
        course.title,
        course.authorName,
        course.statusLevel,
        course.categoryLabel,
        course.categoryTitle,
        course.access,
        this.getSubscribedAuthor(course),
        this.getSubscribedStatus(course),
      ])
    );
  }

  private matchesCourseSearch(values: Array<string | undefined | null>): boolean {
    const term = this.searchText?.trim().toLowerCase() ?? '';
    if (!term) {
      return true;
    }
    return values.some((value) => (value || '').toLowerCase().includes(term));
  }

  get isCoursesContentLoading(): boolean {
    return this.demoModeService.isDemoLoading || this.coursesContentLoading;
  }

  get isRecommendationsEmpty(): boolean {
    return (
      !this.demoModeService.isDemoLoading &&
      !this.demoModeService.isDemoMode &&
      this.coursesLoaded &&
      !(this.viewModel.recommendations ?? []).length
    );
  }

  get isSubscribedCoursesEmpty(): boolean {
    return (
      !this.demoModeService.isDemoLoading &&
      !this.demoModeService.isDemoMode &&
      this.coursesLoaded &&
      !this.allSubscribedCourses.length
    );
  }

  get isDailyGoalsLoading(): boolean {
    return this.isCoursesContentLoading;
  }

  get isDailyGoalsEmpty(): boolean {
    return (
      !this.demoModeService.isDemoLoading &&
      !this.demoModeService.isDemoMode &&
      this.coursesLoaded &&
      !this.dailyGoals.length
    );
  }

  get isActivityFeedLoading(): boolean {
    return this.isCoursesContentLoading;
  }

  get isActivityFeedEmpty(): boolean {
    return (
      !this.demoModeService.isDemoLoading &&
      !this.demoModeService.isDemoMode &&
      this.coursesLoaded &&
      !this.activityFeedItems.length
    );
  }

  get isDemoTransitionLoading(): boolean {
    return this.demoModeService.isDemoLoading;
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

  get badgeStarsCount(): number {
    return Math.max(0, Math.min(5, this.viewModel.insights.badgeStars ?? 0));
  }

  get hasBadgeAwards(): boolean {
    return this.badgeStarsCount > 0 || !!this.viewModel.insights.badgeTitle?.trim();
  }

  get badgeTitleDisplay(): string {
    return this.viewModel.insights.badgeTitle?.trim() || 'Beginner badge';
  }

  get userEmail(): string {
    return (
      this.loginedUserInfo.email ||
      this.loginedUserInfo.contact?.email ||
      (this.demoModeService.isDemoMode ? this.viewModel.insights.hologramEmail : '')
    );
  }

  get isOrganizationAccount(): boolean {
    return (
      sessionStorage.getItem('loginType') === 'organization' ||
      this.loginedUserInfo.role === 'organization'
    );
  }

  get userAccountTypeLabel(): string {
    return this.isOrganizationAccount ? 'Organization' : 'User';
  }

  get userDisplayName(): string {
    const info = this.loginedUserInfo;
    if (this.isOrganizationAccount) {
      return (
        info.name?.trim() ||
        sessionStorage.getItem('activeOrganizationName')?.trim() ||
        ''
      );
    }

    const first = (info.firstName || info.first_name || '').trim();
    const last = (info.lastName || info.last_name || '').trim();
    return [first, last].filter(Boolean).join(' ');
  }

  get hasProfileImage(): boolean {
    return !!(this.loginedUserInfo.profileImage || this.loginedUserInfo.profile_image)?.trim();
  }

  get hologramImage(): string {
    const profile = (
      this.loginedUserInfo.profileImage ||
      this.loginedUserInfo.profile_image ||
      ''
    ).trim();
    return profile || this.brandLogo;
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

  recIcon(index: number): string {
    return ['terminal', 'dataset', 'shield_lock'][index % 3];
  }

  recMatchPercent(index: number): number {
    return Math.max(72, 98 - index * 3);
  }

  recReadTime(index: number): string {
    return `${8 + (index % 4) * 4} min read`;
  }

  get realtimeActivityWidget() {
    return this.viewModel.statWidgets.find((widget) => widget.variant === 'bar-chart');
  }

  get mobileStatRingWidgets() {
    return this.viewModel.statWidgets.filter(
      (widget) => widget.variant === 'dual-rings' || widget.variant === 'ring-bars'
    );
  }

  slideRecommendations(direction: -1 | 1): void {
    const total = this.recommendationsDisplay.length;
    if (total <= 1) {
      return;
    }

    this.syncCarouselOffsetToSelection();
    const pageSize = this.carouselPageSize;
    const visibleCount = Math.min(pageSize, total - this.carouselOffset);
    const localIndex = this.recommendationIndex - this.carouselOffset;

    if (direction === 1) {
      if (localIndex < visibleCount - 1) {
        this.recommendationIndex++;
        return;
      }

      const nextOffset = this.carouselOffset + pageSize;
      if (nextOffset < total) {
        this.carouselOffset = nextOffset;
        this.recommendationIndex = this.carouselOffset;
        return;
      }

      this.carouselOffset = 0;
      this.recommendationIndex = 0;
      return;
    }

    if (localIndex > 0) {
      this.recommendationIndex--;
      return;
    }

    const prevOffset = this.carouselOffset - pageSize;
    if (prevOffset >= 0) {
      this.carouselOffset = prevOffset;
      const prevVisibleCount = Math.min(pageSize, total - this.carouselOffset);
      this.recommendationIndex = this.carouselOffset + prevVisibleCount - 1;
      return;
    }

    const lastOffset = Math.max(0, Math.floor((total - 1) / pageSize) * pageSize);
    this.carouselOffset = lastOffset;
    this.recommendationIndex = total - 1;
  }

  goToRecommendation(index: number): void {
    const total = this.recommendationsDisplay.length;
    if (!total) {
      return;
    }

    const safeIndex = Math.max(0, Math.min(index, total - 1));
    this.recommendationIndex = safeIndex;
    this.syncCarouselOffsetToSelection();
  }

  /** Map API courses into the dashboard view model (live data only). */
  mergeLiveData(): void {
    if (this.demoModeService.isDemoMode) {
      return;
    }

    this.applyStatWidgetsFromOverview();

    if (!this.courseLists.length) {
      this.viewModel.insights.activityFeed = [];
      this.commonService.setActivityFeed([]);
      this.viewModel.insights.badgeTitle = 'Beginner badge';
      this.viewModel.insights.badgeStars = 1;
      return;
    }

    this.viewModel.subscribedCourses = this.courseLists.map((course, index) =>
      this.mapCourseToSubscribedItemLive(course, index)
    );

    this.viewModel.recommendations = this.courseLists.map((course, i) => ({
      id: course.id || `rec-${i}`,
      title: course.courseTitle || 'Untitled course',
      subtitle: course.courseDescription?.slice(0, 80) || '',
      coverStyle: 'linear-gradient(160deg, #1e4a6e 0%, #0a1628 45%, #2a1848 100%)',
      imageUrl: course.courseCoverImage,
      ctaLabel: 'View course',
    }));

    const completedCourses = this.courseLists.filter((c) => (c.chapterCompletedCount ?? 0) > 0);
    if (completedCourses.length) {
      this.viewModel.insights.activityFeed = completedCourses.slice(0, 5).map((c) => ({
        title: 'Recent course completion',
        subtitle: c.courseTitle || 'Recent course',
      }));
    } else {
      this.viewModel.insights.activityFeed = this.courseLists.slice(0, 5).map((c) => ({
        title: 'Subscribed course',
        subtitle: c.courseTitle || 'Recent course',
      }));
    }
    this.commonService.setActivityFeed(this.viewModel.insights.activityFeed);

    this.viewModel.insights.badgeTitle = 'Beginner badge';
    this.viewModel.insights.badgeStars = 1;

    this.viewModel.insights.dailyGoals = this.courseLists
      .map((course) => {
        const parsed = parseInt(String(course.completionPercent || '0').replace('%', ''), 10);
        const percent = Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : 0;
        return { course, percent };
      })
      .filter(({ percent }) => percent < 100)
      .slice(0, 2)
      .map(({ course, percent }, index) => ({
        icon: index === 0 ? ('trophy' as const) : ('check' as const),
        title: course.courseTitle || 'Daily learning goal',
        subtitle: `${course.chapterCompletedCount ?? 0} of ${course.chapterDetails?.length ?? 0} chapters complete`,
        percent,
      }));

    const progress = this.courseLists.slice(0, 7).map((course) => {
      const parsed = parseInt(String(course.completionPercent || '0').replace('%', ''), 10);
      return Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : 0;
    });
    if (progress.length) {
      while (progress.length < 7) {
        progress.push(progress[progress.length - 1] ?? 0);
      }
      this.viewModel.insights.weekProgress = progress.slice(0, 7);
    }
  }

  private applyStatWidgetsFromOverview(): void {
    const overview = this.dashboardOverview ?? {};
    const widgets = createEmptyStatWidgets();

    const totalStudents = Math.max(
      0,
      Number(
        this.loginedUserPrivilege === 'teacher'
          ? overview.assignedStudents
          : overview.totalStudents ?? overview.assignedStudents ?? 0
      )
    );
    const newSubscriptions = Math.max(0, Number(overview.newStudentSubscriptions ?? 0));
    const joinsByDate: number[] = Array.isArray(overview.joinsByDate)
      ? overview.joinsByDate.map((value: number) => Math.max(0, Number(value) || 0))
      : Array(9).fill(0);

    const subscribedFromCourses = this.courseLists.length;
    const completedFromCourses = this.courseLists.filter((course) => {
      if (course.courseStatusLevel?.toLowerCase() === 'completed') {
        return true;
      }
      const parsed = parseInt(String(course.completionPercent || '0').replace('%', ''), 10);
      return Number.isFinite(parsed) && parsed >= 100;
    }).length;

    const totalSubscribed = Math.max(
      0,
      subscribedFromCourses ||
        Number(overview.totalCourses ?? overview.uploadedCourses ?? 0)
    );
    const totalCompleted = Math.max(
      0,
      completedFromCourses ||
        Number(overview.completedCourses ?? overview.courseCompleted ?? 0)
    );
    const completionRate =
      totalSubscribed > 0 ? Math.round((totalCompleted / totalSubscribed) * 100) : 0;
    const newSubRate =
      totalStudents > 0 ? Math.min(100, Math.round((newSubscriptions / totalStudents) * 100)) : 0;

    // Bar chart: subscribed courses by creation_date (last 9 days)
    const coursesByDate = this.buildCountsByCreationDate(
      this.courseLists.map((course) => course.creation_date),
      9
    );
    const todayCourseCreates = coursesByDate[coursesByDate.length - 1] ?? 0;

    const realTime = widgets.find((widget) => widget.id === 'real-time');
    if (realTime) {
      const peak = Math.max(...coursesByDate, 1);
      realTime.bars = coursesByDate.map((count) => Math.round((count / peak) * 100));
      realTime.headerRight = `${todayCourseCreates} today`;
      realTime.headerRightAccent = true;
    }

    const studentsWidget = widgets.find((widget) => widget.id === 'students-rings');
    if (studentsWidget) {
      studentsWidget.headerRight = String(totalStudents);
      studentsWidget.rings = [
        {
          value: Math.min(100, totalStudents),
          displayValue: totalStudents,
          color: '#ff6b2c',
          style: 'progress',
        },
        {
          value: Math.min(100, Math.max(newSubRate, totalStudents ? 35 : 0)),
          displayValue: totalStudents,
          style: 'concentric',
        },
      ];
    }

    const subscriptionsWidget = widgets.find((widget) => widget.id === 'students-mixed');
    if (subscriptionsWidget) {
      subscriptionsWidget.title = 'New Subscriptions';
      subscriptionsWidget.headerRight = String(newSubscriptions);
      subscriptionsWidget.ringValue = newSubRate;
      subscriptionsWidget.ringDisplayValue = newSubscriptions;
      subscriptionsWidget.miniBars = joinsByDate.slice(-8).map((count) => {
        const peak = Math.max(...joinsByDate, 1);
        return Math.round((count / peak) * 100);
      });
    }

    const goalsWidget = widgets.find((widget) => widget.id === 'real-goals');
    if (goalsWidget) {
      goalsWidget.headerRight = `${totalCompleted}/${totalSubscribed}`;
      goalsWidget.rings = [
        {
          value: completionRate,
          displayValue: totalCompleted,
          color: '#ffb59a',
          style: 'progress',
        },
        {
          value: totalSubscribed > 0 ? 100 : 0,
          displayValue: totalSubscribed,
          style: 'concentric',
        },
      ];
    }

    this.viewModel.statWidgets = widgets;
  }

  /** Daily counts for the last `dayCount` calendar days (oldest → newest). */
  private buildCountsByCreationDate(
    dates: Array<Date | string | undefined | null>,
    dayCount = 9
  ): number[] {
    const counts = Array.from({ length: dayCount }, () => 0);
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    dates.forEach((raw) => {
      if (raw == null || raw === '') {
        return;
      }
      const parsed = new Date(raw);
      if (Number.isNaN(parsed.getTime())) {
        return;
      }
      const dayStart = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
      const diffDays = Math.round((todayStart.getTime() - dayStart.getTime()) / 86_400_000);
      if (diffDays >= 0 && diffDays < dayCount) {
        counts[dayCount - 1 - diffDays] += 1;
      }
    });

    return counts;
  }

  private mapCourseToSubscribedItemLive(course: ICourseList, index: number): SubscribedCourseItem {
    const parsed = parseInt(String(course.completionPercent || '0').replace('%', ''), 10);
    const completePercent = Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : 0;
    const chapterCount = course.chapterDetails?.length || 0;
    const completedCount = course.chapterCompletedCount ?? 0;
    const createdBy = course.createdBy;
    const authorName = [createdBy?.firstName || createdBy?.first_name, createdBy?.lastName || createdBy?.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();
    const statusLevel =
      course.courseStatusLevel ||
      this.courseDetailsService.resolveCourseStatusLevel(course);

    return {
      id: course.id,
      title: course.courseTitle || 'Untitled course',
      authorName,
      statusLevel,
      access: course.access === 'private' ? 'private' : 'public',
      categoryLabel: 'A Course by',
      categoryTitle: authorName,
      coverStyle: 'linear-gradient(135deg, #3a2458 0%, #1a1230 100%)',
      imageUrl: course.courseCoverImage,
      featured: index === 0,
      usePlaceholderIcon: !course.courseCoverImage,
      averageRating: course.averageRating,
      chapterCompletedCount: completedCount,
      chapterCount,
      filledStars: Math.round(course.averageRating || 0),
      ratingStars: Math.round(course.averageRating || 0),
      progressFraction: `${completedCount}/${chapterCount || 0}`,
      completePercent,
      ringColor: '#ff6b2c',
      nextSessionValue: `${completedCount}/${chapterCount || 0}`,
    };
  }

  getSubscribedStatus(course: SubscribedCourseItem): string {
    if (course.statusLevel) {
      return course.statusLevel;
    }
    if (course.completePercent >= 100) {
      return 'Completed';
    }
    if (course.completePercent > 0) {
      return 'Progress';
    }
    return 'New';
  }

  getSubscribedAuthor(course: SubscribedCourseItem): string {
    if (course.authorName) {
      return course.authorName;
    }
    if (course.categoryLabel === 'A Course by' && course.categoryTitle) {
      return course.categoryTitle;
    }
    return '';
  }

  getSubscribedLessons(course: SubscribedCourseItem): { completed: number; total: number } | null {
    if (course.chapterCount != null && course.chapterCount > 0) {
      return {
        completed: course.chapterCompletedCount ?? 0,
        total: course.chapterCount,
      };
    }

    const raw = course.progressFraction || course.nextSessionValue || '';
    const match = raw.match(/(\d+)\s*\/\s*(\d+)/);
    if (!match) {
      return null;
    }

    return { completed: Number(match[1]), total: Number(match[2]) };
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
    if (this.demoModeService.isDemoMode) {
      return;
    }

    this.setCoursesContentLoading(true);
    try {
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
    } catch {
      this.courseLists = [];
      this.mergeLiveData();
    } finally {
      this.coursesLoading = false;
      this.coursesLoaded = true;
      this.setCoursesContentLoading(false);
    }
  }

  private setCoursesContentLoading(loading: boolean): void {
    if (this.demoModeService.isDemoMode) {
      this.coursesContentLoading = false;
      return;
    }
    this.coursesContentLoading = loading;
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

  setActiveFilterTab(filter: string): void {
    this.activeFilterTab = filter;
  }

  /** Align tab labels with course status (Pending → Progress). */
  private normalizeFilterTab(value: string | undefined | null): string {
    const tab = (value || '').trim();
    if (!tab) {
      return 'All';
    }
    if (tab.toLowerCase() === 'pending') {
      return 'Progress';
    }
    return tab;
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

    if (!this.demoModeService.isDemoMode) {
      this.applyStatWidgetsFromOverview();
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
