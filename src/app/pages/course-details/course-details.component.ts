import { Component, ViewChild, ElementRef, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChapterDetail, CreatedBy, FileDetail, ICourseList } from '../courses/modal/course-list';
import { VideoPlayerComponent } from 'src/app/components/video-player/video-player.component';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { FileDownloadService } from 'src/app/shared/services/file-download.service';
import { CourseDetailsService } from './course-details.service';
import { ClickEvent, StarRatingModule } from 'angular-star-rating';
import { Subject, takeUntil } from 'rxjs';
import { ICourseStatus } from './model/course-status';
import { IAttachmentObjectInfo } from '../course-upload/model/file-object-info';
import { CommonSearchProfileComponent } from 'src/app/components/common-search-profile/common-search-profile.component';
import { COMPONENT_NAME } from 'src/app/constants/popup-constants';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';
import { VideoDurationService } from 'src/app/shared/services/video-duration.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { QuestionnaireComponent } from '../questionnaire/questionnaire.component';
import { AssessmentAnswersComponent } from 'src/app/components/assessment-answers/assessment-answers.component';
import { StudentAssessmentComponent } from 'src/app/components/student-assessment/student-assessment.component';
import { FavoritesApiService } from 'src/app/services/api-service/favorites-api.service';
import { COURSE_DETAILS_DEMO, ChapterMaterialsGroup, CourseMaterialItem } from './data/course-details-demo.data';
import { DemoModeService } from 'src/app/shared/services/demo-mode.service';
import { UserModel } from '../login-page/model/user-model';
import { Organization } from 'src/app/models/organization.model';
import { OrganizationApiService } from 'src/app/services/api-service/organization-api.service';
import { CourseDiscussionsApiService } from 'src/app/services/api-service/course-discussions-api.service';
import {
  CourseDiscussionItem,
  CourseDiscussionRecord,
} from './model/course-discussion.model';
import { mapOrganizationToUserShape } from 'src/app/shared/utils/user-mapper.util';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-course-detils',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    VideoPlayerComponent,
    StarRatingModule,
    CommonSearchProfileComponent,
    QuestionnaireComponent,
    AssessmentAnswersComponent,
    StudentAssessmentComponent,
  ],
  templateUrl: './course-details.component.html',
  styleUrl: './course-details.component.scss',
})
export class CourseDetailsComponent {
  public mobMenu: boolean = false;
  public profileUrl: string = '';
  public videoRating: number = 0;
  public courseRating: number = 0;
  public ratingSaving = false;
  public videoDuration: string = '';
  public loginedUserRole: string = '';
  private destroy$ = new Subject<void>();
  public activeVideoDescription: string = '';
  public activeVideoInfo: FileDetail = {} as FileDetail;
  public activeChapter: ChapterDetail = {} as ChapterDetail;
  private courseStatusInfo: ICourseStatus = {} as ICourseStatus;
  private courseRatingStatusInfo: ICourseStatus = {} as ICourseStatus;
  private videoStatusInfo: ICourseStatus = {} as ICourseStatus;
  public selectedAttachmentList: any = [];
  public showQuestionAnswer: boolean = false;
  public activeTab: string = 'course';
  public canAccessAnswers: boolean = false;
  public isCourseFavorited: boolean = false;
  private favoriteId: string | null = null;
  public isOrganization: boolean = false;
  public instructorDetails: UserModel | null = null;
  public discussions: CourseDiscussionItem[] = [];
  public discussionsLoading = false;
  public newCommentText = '';
  public submittingComment = false;
  private organizationsList: Organization[] = [];
  private authorDirectoryLoaded = false;
  readonly demo = COURSE_DETAILS_DEMO;
  readonly ringCircumference = 2 * Math.PI * 15;
  @Input() selectedCourseInfo: ICourseList = {} as ICourseList;
  @ViewChild('btnTrigger', { static: true }) btnTrigger!: ElementRef<HTMLButtonElement>;
  @ViewChild(VideoPlayerComponent) videoPlayerComponent!: VideoPlayerComponent;
  constructor(
    private authService: AuthService,
    public commonService: CommonService,
    private fileDownloadService: FileDownloadService,
    private courseDetailsService: CourseDetailsService,
    private videoDurationService: VideoDurationService,
    private dashboardService: DashboardService,
    private router: Router,
    private favoritesApiService: FavoritesApiService,
    private courseDiscussionsApi: CourseDiscussionsApiService,
    private organizationApiService: OrganizationApiService,
    public demoModeService: DemoModeService,
    private cdr: ChangeDetectorRef
  ) {
    this.profileUrl = this.commonService.decodeUrl(
      (this.commonService.loginedUserInfo.profileImage || this.commonService.loginedUserInfo.profile_image) ?? ''
    );
  }
  async ngOnInit(): Promise<void> {
    // Get selected course from route state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.selectedCourseInfo = navigation.extras.state['selectedCourse'] || {} as ICourseList;
    } else {
      // Fallback: check history state
      const state = history.state;
      if (state && state['selectedCourse']) {
        this.selectedCourseInfo = state['selectedCourse'];
      }
    }

    // If no course info, redirect back to courses
    if (!this.selectedCourseInfo || !this.selectedCourseInfo.id) {
      this.router.navigate(['/dashboard/courses']);
      return;
    }

    this.demoModeService.demoMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cdr.markForCheck());

    this.setDefaultVideo();
    this.loginedUserRole = this.commonService?.loginedUserInfo?.role ?? '';
    this.isOrganization = sessionStorage.getItem('loginType') === 'organization';
    this.canAccessAnswers = this.commonService.adminRoleType.includes(this.loginedUserRole);
    await this.courseDetailsService.getCourseStatusList({
      course_id: this.selectedCourseInfo.id,
      organization_id:
        sessionStorage.getItem('organization_id') ||
        this.commonService.loginedUserInfo?.organization_id ||
        undefined,
    });
    this.checkActiveVideoStatus();
    this.checkCourseRatingStatus();
    this.courseDetailsService
      .getReconfigurationHandler()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.checkActiveVideoStatus();
        this.checkCourseRatingStatus();
        this.cdr.markForCheck();
      });
    this.selectedAttachmentList = this.selectedCourseInfo.chapterDetails
      ?.map((chapter) => chapter.attachments)
      ?.flat();
    this.selectedCourseInfo?.chapterDetails?.forEach((chapterDetails) => {
      chapterDetails?.fileDetails?.forEach(async (fileDetails) => {
        const time = await this.videoDurationService.getVideoDuration(fileDetails.fileURL);
        fileDetails.videoDuration = this.commonService.formatTime(time);
      });
    });
    // this.checkAssesmentView();
    this.checkFavoriteStatus();
    await this.ensureAuthorDirectory();
    await this.loadInstructorDetails();
    await this.loadDiscussions();
  }

  private async ensureAuthorDirectory(): Promise<void> {
    if (this.authorDirectoryLoaded) {
      return;
    }

    const tasks: Promise<void>[] = [];

    if (!this.commonService.allUsersList?.length) {
      tasks.push(
        this.authService
          .getAllUsers()
          .then((users) => {
            this.commonService.allUsersList = users ?? [];
          })
          .catch(() => {
            this.commonService.allUsersList = this.commonService.allUsersList ?? [];
          })
      );
    }

    tasks.push(
      firstValueFrom(this.organizationApiService.getOrganizations())
        .then((response) => {
          const data = Array.isArray(response) ? response : (response as { data?: Organization[] })?.data;
          this.organizationsList = data ?? [];
        })
        .catch(() => {
          this.organizationsList = [];
        })
    );

    await Promise.all(tasks);
    this.authorDirectoryLoaded = true;
  }

  private async loadDiscussions(): Promise<void> {
    const courseId = this.selectedCourseInfo?.id;
    if (!courseId) {
      return;
    }

    this.discussionsLoading = true;
    try {
      const organizationId =
        sessionStorage.getItem('organization_id') ||
        this.commonService.loginedUserInfo?.organization_id ||
        undefined;

      const records = await firstValueFrom(
        this.courseDiscussionsApi
          .getDiscussions({
            course_id: courseId,
            organization_id: organizationId,
          })
          .pipe(takeUntil(this.destroy$))
      );

      this.discussions = records
        .slice()
        .sort((a, b) => {
          const aTime = new Date(a.created_at ?? 0).getTime();
          const bTime = new Date(b.created_at ?? 0).getTime();
          return bTime - aTime;
        })
        .map((record) => this.mapDiscussionRecord(record));
    } catch {
      this.discussions = [];
    } finally {
      this.discussionsLoading = false;
    }
  }

  submitComment(): void {
    const comment = this.newCommentText.trim();
    const courseId = this.selectedCourseInfo?.id;
    const createdBy = this.commonService.loginedUserInfo?.id;

    if (!comment || !courseId || !createdBy || this.submittingComment) {
      return;
    }

    this.submittingComment = true;
    const organizationId =
      sessionStorage.getItem('organization_id') ||
      this.commonService.loginedUserInfo?.organization_id ||
      undefined;

    this.courseDiscussionsApi
      .saveDiscussion({
        course_id: courseId,
        chapter_id: this.activeChapter?.id,
        organization_id: organizationId,
        comment,
        created_by: createdBy,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (saved) => {
          this.submittingComment = false;
          this.newCommentText = '';
          if (saved) {
            this.discussions = [this.mapDiscussionRecord(saved), ...this.discussions];
          } else {
            void this.loadDiscussions();
          }
        },
        error: () => {
          this.submittingComment = false;
          this.commonService.openToaster({
            message: 'Unable to post comment. Discussions API may not be available yet.',
            messageType: TOASTER_MESSAGE_TYPE.ERROR,
          });
        },
      });
  }

  onCommentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.submitComment();
    }
  }

  private mapDiscussionRecord(record: CourseDiscussionRecord): CourseDiscussionItem {
    const chapterMeta = this.resolveChapterMeta(record.chapter_id ?? undefined);
    const author = this.resolveAuthorFromId(record.created_by);

    return {
      id: record.id,
      author: author.name,
      avatarUrl: author.avatarUrl,
      chapterLabel: chapterMeta.label,
      chapterTitle: chapterMeta.title,
      comment: record.comment,
      timeAgo: this.formatTimeAgo(record.created_at),
    };
  }

  private resolveAuthorFromId(userId: string): { name: string; avatarUrl?: string } {
    if (!userId) {
      return { name: 'Anonymous' };
    }

    const user = this.commonService.allUsersList?.find((item) => item.id === userId);
    if (user) {
      return {
        name: this.resolveAuthorName(user),
        avatarUrl: user.profile_image || user.profileImage,
      };
    }

    const organization = this.organizationsList.find((item) => item.id === userId);
    if (organization) {
      return {
        name: organization.name?.trim() || organization.contact?.email || 'Organization',
        avatarUrl: organization.profile_image,
      };
    }

    return { name: 'Member' };
  }

  private resolveAuthorName(user: UserModel): string {
    const first = (user.first_name ?? user.firstName ?? '').trim();
    const last = (user.last_name ?? user.lastName ?? '').trim();
    const fullName = `${first} ${last}`.trim();
    return fullName || user.name?.trim() || user.contact?.email || user.email || 'Member';
  }

  private resolveChapterMeta(chapterId?: string): { label: string; title: string } {
    const courseTitle = this.selectedCourseInfo?.courseTitle || 'Course';
    if (!chapterId) {
      return { label: 'Course', title: courseTitle };
    }

    const chapters = this.selectedCourseInfo?.chapterDetails ?? [];
    const index = chapters.findIndex((chapter) => chapter.id === chapterId);
    const chapter = chapters[index];
    if (!chapter) {
      return { label: 'Course', title: courseTitle };
    }

    const title = chapter.chapterTitle?.trim() || `Lesson ${index + 1}`;
    return { label: `Chapter ${index + 1}`, title };
  }

  private formatTimeAgo(isoDate?: string): string {
    if (!isoDate) {
      return 'Just now';
    }

    const then = new Date(isoDate).getTime();
    if (Number.isNaN(then)) {
      return 'Recently';
    }

    const diffMs = Date.now() - then;
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;

    return new Date(isoDate).toLocaleDateString();
  }

  discussionInitials(author: string): string {
    return (author.trim().charAt(0) || '?').toUpperCase();
  }

  private resolveCreatorId(): string | null {
    const creator = this.selectedCourseInfo?.createdBy as CreatedBy | string | undefined;
    if (!creator) {
      return null;
    }
    if (typeof creator === 'string') {
      return creator.trim() || null;
    }
    return creator.id?.trim() || null;
  }

  private mapUserToInstructor(user: UserModel | CreatedBy): UserModel {
    return {
      id: user.id,
      first_name: user.first_name ?? user.firstName ?? '',
      last_name: user.last_name ?? user.lastName,
      firstName: user.firstName ?? user.first_name,
      lastName: user.lastName ?? user.last_name,
      profile_image: user.profile_image ?? user.profileImage,
      profileImage: user.profileImage ?? user.profile_image,
      contact: user.contact,
      role: user.role,
      email: user.email ?? user.contact?.email,
      about: (user as UserModel).about,
    };
  }

  private async loadInstructorDetails(): Promise<void> {
    const creatorId = this.resolveCreatorId();
    const embeddedCreator = this.courseCreator;

    if (embeddedCreator?.first_name || embeddedCreator?.firstName) {
      this.instructorDetails = this.mapUserToInstructor(embeddedCreator);
    }

    if (!creatorId) {
      return;
    }

    const cachedUser = this.commonService.allUsersList?.find((user) => user.id === creatorId);
    if (cachedUser) {
      this.instructorDetails = this.mapUserToInstructor(cachedUser);
      return;
    }

    const cachedOrganization = this.organizationsList.find((org) => org.id === creatorId);
    if (cachedOrganization) {
      this.instructorDetails = this.mapUserToInstructor(mapOrganizationToUserShape(cachedOrganization));
      return;
    }

    const fetchedUser = await this.authService.getUserById(creatorId);
    if (fetchedUser) {
      this.instructorDetails = this.mapUserToInstructor(fetchedUser);
    }
  }

  checkFavoriteStatus(): void {
    const userId = this.commonService.loginedUserInfo?.id;
    const courseId = this.selectedCourseInfo?.id;
    if (!userId || !courseId) return;

    this.favoritesApiService
      .getFavorites(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const data = res?.data ?? res;
          const favorites = Array.isArray(data) ? data : [];
          const fav = favorites.find((f: any) => (f.courseId ?? f.course_id) === courseId);
          this.isCourseFavorited = !!fav;
          this.favoriteId = fav?.id ?? null;
        },
        error: () => {
          this.isCourseFavorited = false;
          this.favoriteId = null;
        },
      });
  }

  toggleFavorite(): void {
    const userId = this.commonService.loginedUserInfo?.id;
    const courseId = this.selectedCourseInfo?.id;
    if (!userId || !courseId) return;

    if (this.isCourseFavorited) {
      const obs = this.favoriteId
        ? this.favoritesApiService.removeFavorite(this.favoriteId)
        : this.favoritesApiService.removeFavoriteByCourse(userId, courseId);
      obs.pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.isCourseFavorited = false;
          this.favoriteId = null;
        },
        error: (err) => console.error('Error removing favorite:', err),
      });
    } else {
      this.favoritesApiService
        .addFavorite(userId, courseId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res: any) => {
            const data = res?.data ?? res;
            this.isCourseFavorited = true;
            this.favoriteId = data?.id ?? null;
          },
          error: (err) => console.error('Error adding favorite:', err),
        });
    }
  }

  setDefaultVideo() {
    this.activeChapter = this.selectedCourseInfo?.chapterDetails[0];
    this.activeVideoInfo = this.selectedCourseInfo?.chapterDetails?.[0]?.fileDetails?.[0];
    this.activeVideoDescription =
      this.selectedCourseInfo?.chapterDetails?.[0]?.fileDetails?.[0]?.description;
  }
  triggerMenu() {
    this.btnTrigger.nativeElement.click();
    this.mobMenu = false;
  }
  mobileMenu() {
    this.mobMenu = !this.mobMenu;
  }

  openCourseAccordian(event: Event, chapterDetails: ChapterDetail) {
    this.activeChapter = chapterDetails;
    const element = event.currentTarget as HTMLElement;
    const panel = element.nextElementSibling as HTMLElement | null;
    if (!panel) return;
    if (panel.style.maxHeight) {
      panel.style.maxHeight = '';
    } else {
      panel.style.maxHeight = panel.scrollHeight + 'px';
    }
  }
  changeVideoUrl(fileDetails: FileDetail) {
    if (this.activeVideoInfo?.id !== fileDetails.id) {
      this.videoStatusInfo = {} as ICourseStatus;
    }
    this.activeVideoInfo = fileDetails;
    this.activeVideoDescription = fileDetails.description;
    this.checkActiveVideoStatus();
  }
  handleStartAssessment() {
    this.setActiveTab('assessment');
  }
  logOut() {
    this.authService.logOutApplication();
  }
  videoDurationHandler(duration: number) {
    this.videoDuration = this.courseDetailsService.formatDuration(duration);
  }
  downloadMaterial(type: string) {
    if (type === 'VIDEO') {
      this.fileDownloadService.downloadFile(
        this.activeVideoInfo.fileURL,
        this.activeVideoInfo.name ?? '',
        this.destroy$
      );
    } else {
      this.activeChapter.attachments.forEach((attachment) => {
        this.fileDownloadService.downloadFile(
          attachment.fileURL,
          attachment.name ?? '',
          this.destroy$
        );
      });
    }
  }
  videoStatusUpdateHandler(triggerType: string) {
    if (triggerType === 'PAUSE' || !this.courseStatusInfo?.id) {
      this.updateVideoStatus(undefined, true);
    }
  }
  async onCourseRatingChange(event?: ClickEvent): Promise<void> {
    if (!event?.rating || this.ratingSaving || !this.canRateCourse) {
      return;
    }

    this.courseRating = event.rating;
    this.ratingSaving = true;
    try {
      await this.courseDetailsService.saveCourseLevelRating(
        {
          rating: event.rating,
          courseId: this.selectedCourseInfo.id,
          courseRatingStatusInfo: this.courseRatingStatusInfo,
        },
        this.destroy$
      );
    } finally {
      this.ratingSaving = false;
    }
  }

  checkCourseRatingStatus(): void {
    const userId = this.commonService.loginedUserInfo?.id;
    const courseId = this.selectedCourseInfo?.id;
    if (!userId || !courseId) {
      return;
    }

    const courseRatingStatus = this.courseDetailsService.courseStatusList.find(
      (status) =>
        status.createdBy === userId &&
        status.parentId === courseId &&
        status.parentType === 'Course'
    );

    this.courseRatingStatusInfo = courseRatingStatus ?? ({} as ICourseStatus);
    this.courseRating = courseRatingStatus?.rating ?? 0;
  }

  get canRateCourse(): boolean {
    return this.loginedUserRole === 'student';
  }

  async updateVideoStatus(event?: ClickEvent, isVideo?: boolean) {
    if (event?.rating) {
      this.videoRating = event?.rating;
    }
    const videoTimeInfo = this.videoPlayerComponent.getVideoTimeUpdate;
    const videoPercentage = (videoTimeInfo.currentTime / videoTimeInfo.duration) * 100;
    await this.courseDetailsService.saveCourseRating(
      {
        isVideo: isVideo,
        videoPercentage: videoPercentage,
        activeFile: this.activeVideoInfo,
        activeChapter: this.activeChapter,
        videoStatusInfo: this.videoStatusInfo,
        courseStatusInfo: this.courseStatusInfo,
        rating: event?.rating || this.videoRating,
      },
      this.destroy$
    );
    setTimeout(() => {
      this.checkAssesmentView();
    }, 1000);
  }
  checkActiveVideoStatus() {
    const userId = this.commonService.loginedUserInfo?.id;
    const courseStatusInfo = this.courseDetailsService.courseStatusList.find(
      (courseStatus) =>
        courseStatus.createdBy === userId &&
        courseStatus.parentId === this.activeVideoInfo.parentId
    );
    const videoStatusInfo = this.courseDetailsService.courseStatusList.find(
      (courseStatus) =>
        courseStatus.createdBy === userId && courseStatus.parentId === this.activeVideoInfo.id
    );

    this.courseStatusInfo = courseStatusInfo ?? ({} as ICourseStatus);
    this.videoStatusInfo = videoStatusInfo ?? ({} as ICourseStatus);
    if (courseStatusInfo?.rating != null) {
      this.videoRating = courseStatusInfo.rating;
    }
  }
  previewDocument(attachment: IAttachmentObjectInfo) {
    this.commonService.openPopupModel({
      url: attachment.fileURL,
      data: attachment,
      title: attachment.name,
      fileType: 'ATTACHMENT',
      componentName: COMPONENT_NAME.FILE_VIEWER,
    });
  }
  downloadFile(attachment: IAttachmentObjectInfo) {
    this.fileDownloadService.downloadFile(attachment.fileURL, attachment.name ?? '', this.destroy$);
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  openAttachmentAccordian(event: Event) {
    const element = event.currentTarget as HTMLElement;
    element.classList.toggle('active');
    const panel = element.nextElementSibling as HTMLElement | null;
    if (!panel) return;
    if (panel.style.maxHeight) {
      panel.style.maxHeight = '';
    } else {
      panel.style.maxHeight = panel.scrollHeight + 'px';
    }
  }
  checkAssesmentView() {
    let completedLessonCount: number = 0;
    this.selectedCourseInfo.chapterDetails.forEach((chapterDetails, index) => {
      const chapterCompleted = chapterDetails.fileDetails.every((fileDetails) => {
        return this.courseDetailsService.courseStatusList.find(
          (courseStatus) =>
            courseStatus.parentId === fileDetails.id && +courseStatus.percentage === 100
        );
      });
      if (chapterCompleted) {
        completedLessonCount = (completedLessonCount || 0) + 1;
      }
      if (index + 1 === this.selectedCourseInfo.chapterDetails.length) {
        if (completedLessonCount === this.selectedCourseInfo.chapterDetails.length) {
          this.showQuestionAnswer = true;
        }
      }
    });
  }
  setActiveTab(tab: string) {
    this.activeTab = tab;
    if (tab === 'assessment') {
      
    }
  }

  get heroTitle(): string {
    return (this.selectedCourseInfo?.courseTitle || 'MAJESTIC WARHORSE').toUpperCase();
  }

  get heroSubtitle(): string {
    if (!this.demoModeService.isDemoMode) {
      return '';
    }
    return this.demo.heroSubtitle;
  }

  get descriptionHtml(): string {
    const raw =
      this.selectedCourseInfo?.courseDescription ||
      (this.demoModeService.isDemoMode ? this.demo.descriptionFallback : '');
    if (!raw) {
      return '';
    }
    const escaped = raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const highlights = [
      '3D sculpting process',
      'concept sketch',
      'topology',
      'rendering',
      'presented render',
      'Majestic Warhorse',
      'sculpting process',
      'Warhorse',
    ];
    let html = escaped;
    highlights.forEach((term) => {
      const re = new RegExp(`\\b(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
      html = html.replace(re, '<span class="cd-highlight">$1</span>');
    });
    return html;
  }

  get chapterMaterialsDisplay(): ChapterMaterialsGroup[] {
    const chapters = this.selectedCourseInfo?.chapterDetails ?? [];
    const liveGroups: ChapterMaterialsGroup[] = [];

    chapters.forEach((chapter, index) => {
      const attachments = chapter.attachments ?? [];
      if (!attachments.length) {
        return;
      }

      liveGroups.push({
        chapterId: chapter.id || `chapter-${index}`,
        chapterLabel: this.chapterLabel(chapter, index),
        materials: attachments.map((item, attIndex) => ({
          id: `${chapter.id || index}-material-${attIndex}`,
          name: item.name || `Attachment ${attIndex + 1}`,
          type: this.guessMaterialType(item.name || ''),
          attachment: item,
        })),
      });
    });

    if (liveGroups.length) {
      return liveGroups;
    }

    return this.demoModeService.isDemoMode ? this.demo.materialsByChapter : [];
  }

  chapterLabel(chapter: ChapterDetail, index: number): string {
    const title = chapter.chapterTitle?.trim() || `Lesson ${index + 1}`;
    if (/^chapter\s+\d+/i.test(title)) {
      return title;
    }
    return `Chapter ${index + 1}: ${title}`;
  }

  materialTypeLabel(type: CourseMaterialItem['type']): string {
    if (type === 'psd') return 'PSD';
    if (type === 'pdf') return 'PDF';
    return 'ZIP';
  }

  guessMaterialType(name: string): CourseMaterialItem['type'] {
    const lower = name.toLowerCase();
    if (lower.endsWith('.psd')) return 'psd';
    if (lower.endsWith('.pdf')) return 'pdf';
    return 'zip';
  }

  downloadMaterialItem(material: CourseMaterialItem & { attachment?: IAttachmentObjectInfo }): void {
    const attachment = this.resolveMaterialAttachment(material);
    if (attachment) {
      this.downloadFile(attachment);
    }
  }

  previewMaterialItem(material: CourseMaterialItem & { attachment?: IAttachmentObjectInfo }): void {
    const attachment = this.resolveMaterialAttachment(material);
    if (attachment?.fileURL) {
      this.previewDocument(attachment);
    }
  }

  private resolveMaterialAttachment(
    material: CourseMaterialItem & { attachment?: IAttachmentObjectInfo }
  ): IAttachmentObjectInfo | undefined {
    if (material.attachment) {
      return material.attachment;
    }
    const attachments = this.selectedAttachmentList || [];
    const byName = attachments.find((a: IAttachmentObjectInfo) => a.name === material.name);
    if (byName) {
      return byName;
    }
    const index = Number.parseInt(material.id.replace('material-', ''), 10);
    if (!Number.isNaN(index) && attachments[index]) {
      return attachments[index];
    }
    return undefined;
  }

  get courseCreator(): CreatedBy | undefined {
    const creator = this.selectedCourseInfo?.createdBy as CreatedBy | string | undefined;
    if (!creator || typeof creator === 'string') {
      return undefined;
    }
    return creator;
  }

  get instructorName(): string {
    const creator = this.instructorDetails ?? this.courseCreator;
    if (!creator) {
      return 'Instructor';
    }
    const first = (creator.firstName || creator.first_name || '').trim();
    const last = (creator.lastName || creator.last_name || '').trim();
    return `${first} ${last}`.trim() || 'Instructor';
  }

  get instructorImage(): string {
    const creator = this.instructorDetails ?? this.courseCreator;
    const img = creator?.profileImage || creator?.profile_image || '';
    return img ? this.commonService.decodeUrl(img) : '../../../assets/images/logo-majestic-hourse.svg';
  }

  get instructorBio(): string {
    const about = this.instructorDetails?.about?.trim();
    if (about) {
      return about;
    }
    return this.demoModeService.isDemoMode ? this.demo.instructorBio : '';
  }

  get courseCompletionPercent(): number {
    const chapters = this.selectedCourseInfo?.chapterDetails;
    if (!chapters?.length) return 0;

    let total = 0;
    let count = 0;
    chapters.forEach((chapter) => {
      (chapter.fileDetails || []).forEach((file) => {
        total += this.getFileWatchPercentage(file.id);
        count++;
      });
    });

    return count ? Math.round(total / count) : 0;
  }

  chapterProgress(chapter: ChapterDetail): number {
    const files = chapter.fileDetails || [];
    if (!files.length) return 0;

    const total = files.reduce((sum, file) => sum + this.getFileWatchPercentage(file.id), 0);
    return Math.round(total / files.length);
  }

  private getFileWatchPercentage(fileId: string): number {
    const userId = this.commonService.loginedUserInfo?.id;
    if (!userId || !fileId) return 0;

    const status = this.courseDetailsService.courseStatusList.find(
      (item) => item.createdBy === userId && item.parentId === fileId
    );
    const percentage = status?.percentage != null ? +status.percentage : 0;
    return Math.min(100, Math.max(0, percentage));
  }

  ringOffset(percent: number): number {
    const safe = Math.min(100, Math.max(0, percent));
    return this.ringCircumference * (1 - safe / 100);
  }
}
