import {
  Component,
  ViewChild,
  ElementRef,
  Output,
  EventEmitter,
  Input,
  OnChanges,
  SimpleChanges,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IChapterInfo } from './model/chapter-info';
import { CourseUploadService } from './course-upload.service';
import { IMainCourseInfo } from './model/course-info';
import { Subject } from 'rxjs';
import { ICourseList } from '../courses/modal/course-list';
import { IAttachmentObjectInfo, IFileObjectInfo } from './model/file-object-info';
import { CommonService } from 'src/app/shared/services/common.service';
import { COMPONENT_NAME } from 'src/app/constants/popup-constants';
import { ProgressBarComponent } from 'src/app/shared/progress-bar/progress-bar.component';
import { DASHBOARD_NAV_ROUTES } from '../dashboard/dashboard-routes.config';
import { NgxSpinnerService } from 'ngx-spinner';

type RightPaneTab = 'preview' | 'recent';

@Component({
  selector: 'app-course-upload',
  standalone: true,
  imports: [FormsModule, CommonModule, ProgressBarComponent],
  templateUrl: './course-upload.component.html',
  styleUrl: './course-upload.component.scss',
})
export class CourseUploadComponent implements OnChanges, OnInit, OnDestroy {
  public mobMenu: boolean = false;
  private destroy$ = new Subject<void>();
  public mainCourseInfo: IMainCourseInfo;
  public courseChapterList: IChapterInfo[] = [];
  public lastUpdatedCourse: ICourseList[] = [];
  public rightPaneTab: RightPaneTab = 'preview';
  public coverImageUpload = { completedPercentage: '' };
  public isPublishing = false;
  @Input() courseData: ICourseList | null = null;
  @Output() courseSaved = new EventEmitter<void>();

  constructor(
    private courseUploadService: CourseUploadService,
    private commonService: CommonService,
    private router: Router,
    private route: ActivatedRoute,
    private spinner: NgxSpinnerService
  ) {
    this.mainCourseInfo = { ...this.courseUploadService.MAIN_COURSE_INFO };
    this.addNewChapter();
  }

  async ngOnInit(): Promise<void> {
    await this.fetchLastUpdatedCourses();
    await this.loadCourseFromRoute();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['courseData'] && this.courseData) {
      this.handleCourseEdit(this.courseData);
    }
  }

  @ViewChild('btnTrigger', { static: true }) btnTrigger!: ElementRef<HTMLButtonElement>;

  get instructorName(): string {
    const info = this.commonService.loginedUserInfo;
    const first = (info?.firstName || info?.first_name || '').trim();
    const last = (info?.lastName || info?.last_name || '').trim();
    return [first, last].filter(Boolean).join(' ') || info?.name || 'Instructor';
  }

  get instructorAvatar(): string {
    const raw = this.commonService.loginedUserInfo?.profileImage || this.commonService.loginedUserInfo?.profile_image;
    return this.commonService.decodeUrl(raw ?? '') || 'assets/images/logo-majestic-hourse.svg';
  }

  get previewProgressPercent(): number {
    if (!this.courseChapterList.length) {
      return 0;
    }
    const withVideo = this.courseChapterList.filter((chapter) =>
      chapter.fileDetails?.some((file) => file.fileURL?.trim())
    ).length;
    return Math.round((withVideo / this.courseChapterList.length) * 100);
  }

  get previewCompletedChapters(): number {
    return this.courseChapterList.filter((chapter) =>
      chapter.fileDetails?.every((file) => file.fileURL?.trim())
    ).length;
  }

  setRightPaneTab(tab: RightPaneTab): void {
    this.rightPaneTab = tab;
  }

  navigateBack(): void {
    void this.router.navigate([DASHBOARD_NAV_ROUTES.courses]);
  }

  openRecentCourse(course: ICourseList): void {
    this.handleCourseEdit(course);
    this.rightPaneTab = 'preview';
    void this.router.navigate([DASHBOARD_NAV_ROUTES.courseUpload], {
      queryParams: { courseId: course.id },
      replaceUrl: true,
    });
  }

  triggerMenu() {
    this.btnTrigger.nativeElement.click();
    this.mobMenu = false;
  }

  mobileMenu() {
    this.mobMenu = !this.mobMenu;
  }

  addNewVideoList(chapter: IChapterInfo): void {
    if (!this.courseUploadService.validateChapterVideosBeforeAdd(chapter)) {
      return;
    }

    chapter.fileDetails = chapter.fileDetails.concat({
      ...this.courseUploadService.FILE_OBJECT_INFO,
    });
  }

  async addNewChapter(isCheckValidaation?: boolean) {
    let isValid: any = true;
    if (isCheckValidaation) {
      isValid = await this.courseUploadService.courseSaveValidation({
        mainCourseInfo: this.mainCourseInfo,
        chapterInfo: this.courseChapterList,
      });
    }
    if (isValid) {
      const newChapter = { ...this.courseUploadService.CHAPTER_INFO };
      newChapter.fileDetails = newChapter.fileDetails.concat({
        ...this.courseUploadService.FILE_OBJECT_INFO,
      });
      this.courseChapterList = this.courseChapterList.concat(newChapter);
    }
  }

  openFileUploadWindow(nativeElement: HTMLElement): void {
    nativeElement?.click();
  }

  removeVideo(chapter: IChapterInfo, index: number): void {
    if (chapter.fileDetails.length <= 1) {
      chapter.fileDetails[0] = { ...this.courseUploadService.FILE_OBJECT_INFO };
      return;
    }
    chapter.fileDetails.splice(index, 1);
  }

  getVideoDisplayName(item: IFileObjectInfo, index: number): string {
    if (item.name?.trim()) {
      return item.name;
    }
    if (item.fileURL?.trim()) {
      const parts = item.fileURL.split('/');
      return parts[parts.length - 1] || `Video ${(index + 1).toString().padStart(2, '0')}`;
    }
    return `Video ${(index + 1).toString().padStart(2, '0')}`;
  }

  getVideoTypeLabel(item: IFileObjectInfo): string {
    if (item.name?.trim()) {
      return this.getFileTypeLabel(item.name);
    }
    const url = item.fileURL?.toLowerCase() || '';
    if (url.includes('vimeo.com')) {
      return 'Vimeo Video';
    }
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'YouTube Video';
    }
    return item.fileURL?.trim() ? 'Video File' : 'Pending Upload';
  }

  async onFileSelected(
    event: Event,
    uploadType: string,
    mainIndex?: number,
    videoDetailsIndex?: number
  ): Promise<void> {
    const target = event.target as HTMLInputElement;
    const files = target.files as FileList;
    let uploadObjectItem: any = {};
    if (uploadType === 'COVER_IMAGE') {
      uploadObjectItem = this.coverImageUpload;
      uploadObjectItem.completedPercentage = '0';
    } else if (uploadType === 'VIDEO_FILE') {
      if ((mainIndex || mainIndex == 0) && this.courseChapterList[mainIndex]) {
        if (
          (videoDetailsIndex || videoDetailsIndex == 0) &&
          this.courseChapterList[mainIndex].fileDetails[videoDetailsIndex]
        ) {
          uploadObjectItem = this.courseChapterList[mainIndex].fileDetails[videoDetailsIndex];
          uploadObjectItem.completedPercentage = '0';
        }
      }
    }
    const fileUrl = await this.courseUploadService.onFileUpload(
      this.destroy$,
      files[0],
      uploadType,
      uploadObjectItem
    );
    switch (uploadType) {
      case 'COVER_IMAGE':
        if (fileUrl) {
          this.mainCourseInfo.courseCoverImage = fileUrl;
        }
        this.coverImageUpload.completedPercentage = '';
        break;
      case 'ATTACHMENT':
        if ((mainIndex || mainIndex == 0) && this.courseChapterList[mainIndex]) {
          this.courseChapterList[mainIndex].attachments = this.courseChapterList[
            mainIndex
          ].attachments.concat({ fileURL: fileUrl, name: files[0].name });
        }
        break;
      case 'VIDEO_FILE':
        if ((mainIndex || mainIndex == 0) && this.courseChapterList[mainIndex]) {
          if (
            (videoDetailsIndex || videoDetailsIndex == 0) &&
            this.courseChapterList[mainIndex].fileDetails[videoDetailsIndex]
          ) {
            this.courseChapterList[mainIndex].fileDetails[videoDetailsIndex].fileURL = fileUrl;
            this.courseChapterList[mainIndex].fileDetails[videoDetailsIndex].name = files[0].name;
          }
        }
        break;
    }
  }

  async saveButtonClick() {
    if (this.isPublishing) {
      return;
    }

    this.isPublishing = true;
    void this.spinner.show();

    try {
      const isCourseUploaded = await this.courseUploadService.saveCourseDetails(
        {
          mainCourseInfo: this.mainCourseInfo,
          chapterInfo: this.courseChapterList,
        },
        this.destroy$
      );

      if (isCourseUploaded) {
        this.clearPage();
        this.courseSaved.emit();
        void this.router.navigate([DASHBOARD_NAV_ROUTES.courses]);
      }
    } finally {
      this.isPublishing = false;
      void this.spinner.hide();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async fetchLastUpdatedCourses() {
    this.lastUpdatedCourse = await this.courseUploadService.fetchUploadedCourses();
  }

  private async loadCourseFromRoute(): Promise<void> {
    const courseId = this.route.snapshot.queryParamMap.get('courseId');
    if (!courseId || this.courseData) {
      return;
    }

    const course = this.lastUpdatedCourse.find((item) => item.id === courseId);
    if (course) {
      this.handleCourseEdit(course);
    }
  }

  handleCourseEdit(courseInfo: ICourseList) {
    this.mainCourseInfo = {
      id: courseInfo.id,
      courseCoverImage: courseInfo.courseCoverImage,
      courseTitle: courseInfo.courseTitle,
      courseDescription: courseInfo.courseDescription,
      access: courseInfo.access === 'private' ? 'private' : 'public',
    };
    this.courseChapterList = structuredClone(courseInfo.chapterDetails as IChapterInfo[]);
  }

  previewVideo(fileDetails: IFileObjectInfo) {
    this.commonService.openPopupModel({
      url: fileDetails.fileURL,
      data: fileDetails,
      title: fileDetails.name,
      fileType: 'VIDEO',
      componentName: COMPONENT_NAME.FILE_VIEWER,
    });
  }

  previewAttachment(attachment: IAttachmentObjectInfo): void {
    this.commonService.openPopupModel({
      data: attachment,
      title: attachment.name,
      fileType: 'ATTACHMENT',
      url: attachment.fileURL,
      componentName: COMPONENT_NAME.FILE_VIEWER,
    });
  }

  removeAttachment(chapter: IChapterInfo, index: number): void {
    chapter.attachments.splice(index, 1);
  }

  getFileTypeLabel(fileName: string): string {
    const ext = (fileName.split('.').pop() || '').toLowerCase();
    const labels: Record<string, string> = {
      pdf: 'PDF Document',
      doc: 'Word Document',
      docx: 'Word Document',
      png: 'Image File',
      jpg: 'Image File',
      jpeg: 'Image File',
      gif: 'Image File',
      webp: 'Image File',
      mp4: 'Video File',
      mov: 'Video File',
      sh: 'Script',
      zip: 'Archive',
      txt: 'Text File',
    };
    return labels[ext] || `${ext.toUpperCase()} File`;
  }

  getFileIcon(fileName: string): string {
    const ext = (fileName.split('.').pop() || '').toLowerCase();
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) {
      return 'description';
    }
    if (['sh', 'bash', 'js', 'ts', 'py'].includes(ext)) {
      return 'terminal';
    }
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
      return 'image';
    }
    if (['mp4', 'mov', 'avi'].includes(ext)) {
      return 'movie';
    }
    return 'draft';
  }

  getFileIconKind(fileName: string): string {
    const ext = (fileName.split('.').pop() || '').toLowerCase();
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) {
      return 'doc';
    }
    if (['sh', 'bash', 'js', 'ts', 'py'].includes(ext)) {
      return 'script';
    }
    return 'default';
  }

  clearPage() {
    this.courseChapterList = [];
    this.addNewChapter();
    this.mainCourseInfo = { ...this.courseUploadService.MAIN_COURSE_INFO };
    this.coverImageUpload.completedPercentage = '';
    this.fetchLastUpdatedCourses();
  }

  isFormValid(): boolean {
    if (!this.mainCourseInfo.courseTitle || !this.mainCourseInfo.courseTitle.trim()) {
      return false;
    }
    if (!this.mainCourseInfo.courseDescription || !this.mainCourseInfo.courseDescription.trim()) {
      return false;
    }
    if (!this.mainCourseInfo.courseCoverImage || !this.mainCourseInfo.courseCoverImage.trim()) {
      return false;
    }

    if (!this.courseChapterList || this.courseChapterList.length === 0) {
      return false;
    }

    for (const chapter of this.courseChapterList) {
      if (!chapter.chapterTitle || !chapter.chapterTitle.trim()) {
        return false;
      }
      if (!chapter.fileDetails || chapter.fileDetails.length === 0) {
        return false;
      }
      for (const video of chapter.fileDetails) {
        if (!video.fileURL || !video.fileURL.trim()) {
          return false;
        }
      }
    }

    return true;
  }
}
