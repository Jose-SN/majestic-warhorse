import { Component, ViewChild, ElementRef, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChapterDetail, FileDetail, ICourseList } from '../courses/modal/course-list';
import { VideoPlayerComponent } from 'src/app/components/video-player/video-player.component';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { FileDownloadService } from 'src/app/shared/services/file-download.service';
import { CourseDetailsService } from './course-details.service';
import { ClickEvent, RatingChangeEvent, StarRatingModule } from 'angular-star-rating';
import { Subject, takeLast, takeUntil } from 'rxjs';
import { ICourseStatus } from './model/course-status';
import { IAttachmentObjectInfo } from '../course-upload/model/file-object-info';
import { CommonSearchProfileComponent } from 'src/app/components/common-search-profile/common-search-profile.component';
import { COMPONENT_NAME } from 'src/app/constants/popup-constants';
import { VideoDurationService } from 'src/app/shared/services/video-duration.service';
import { DashboardService } from '../dashboard/dashboard.service';

@Component({
  selector: 'app-course-detils',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    VideoPlayerComponent,
    StarRatingModule,
    CommonSearchProfileComponent,
  ],
  templateUrl: './course-details.component.html',
  styleUrl: './course-details.component.scss',
})
export class CourseDetailsComponent {
  public mobMenu: boolean = false;
  public profileUrl: string = '';
  public videoRating: number = 0;
  public videoDuration: string = '';
  public loginedUserRole: string = '';
  private destroy$ = new Subject<void>();
  public activeVideoDescription: string = '';
  public activeVideoInfo: FileDetail = {} as FileDetail;
  public activeChapter: ChapterDetail = {} as ChapterDetail;
  private courseStatusInfo: ICourseStatus = {} as ICourseStatus;
  private videoStatusInfo: ICourseStatus = {} as ICourseStatus;
  public selectedAttachmentList: any = [];
  public showQuestionAnswer: boolean = false;
  @Input() selectedCourseInfo: ICourseList = {} as ICourseList;
  @ViewChild('btnTrigger', { static: true }) btnTrigger!: ElementRef<HTMLButtonElement>;
  @ViewChild(VideoPlayerComponent) videoPlayerComponent!: VideoPlayerComponent;
  constructor(
    private authService: AuthService,
    public commonService: CommonService,
    private fileDownloadService: FileDownloadService,
    private courseDetailsService: CourseDetailsService,
    private videoDurationService: VideoDurationService,
    private dashboardService: DashboardService
  ) {
    this.profileUrl = this.commonService.decodeUrl(
      this.commonService.loginedUserInfo.profileImage ?? ''
    );
  }
  async ngOnInit(): Promise<void> {
    this.setDefaultVideo();
    this.loginedUserRole = this.commonService?.loginedUserInfo?.role ?? '';
    await this.courseDetailsService.getCourseStatusList();
    this.checkActiveVideoStatus();
    this.courseDetailsService
      .getReconfigurationHandler()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.checkActiveVideoStatus();
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

  openCourseAccordian(event: any, chapterDetails: ChapterDetail) {
    this.activeChapter = chapterDetails;
    const element = event.target;
    const panel = element.nextElementSibling;
    if (panel.style.maxHeight) {
      panel.style.maxHeight = null;
    } else {
      panel.style.maxHeight = panel.scrollHeight + 'px';
    }
  }
  changeVideoUrl(fileDetails: FileDetail) {
    this.activeVideoInfo = fileDetails;
    this.activeVideoDescription = fileDetails.description;
  }
  handleStartAssessment() {
    this.dashboardService.setSidePanelChangeValue(this.dashboardService.SIDE_PANEL_LIST.ASSESMENT);
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
    if (triggerType === 'PAUSE' || !this.courseStatusInfo?._id) {
      this.updateVideoStatus(undefined, true);
    }
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
    // setTimeout(() => {
    //   this.checkAssesmentView();
    // },5000);
  }
  checkActiveVideoStatus() {
    const courseStatusInfo = this.courseDetailsService.courseStatusList.find(
      (courseStatus) =>
        courseStatus.createdBy === this.commonService.loginedUserInfo.id &&
        courseStatus.parentId === this.activeVideoInfo.parentId
    );
    const videoStatusInfo = this.courseDetailsService.courseStatusList.find(
      (courseStatus) =>
        courseStatus.createdBy === this.commonService.loginedUserInfo.id &&
        courseStatus.parentId === this.activeVideoInfo._id
    );
    if (courseStatusInfo) {
      this.courseStatusInfo = courseStatusInfo;
      this.videoRating = this.courseStatusInfo.rating;
    }
    if (videoStatusInfo) {
      this.videoStatusInfo = videoStatusInfo;
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
  openAttachmentAccordian(event: any) {
    const element = event.target;
    element.classList.toggle('active');
    const panel = element.nextElementSibling;
    if (panel.style.maxHeight) {
      panel.style.maxHeight = null;
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
            courseStatus.parentId === fileDetails._id && +courseStatus.percentage === 100
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
}