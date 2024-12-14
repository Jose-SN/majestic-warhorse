import { Component, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AttachmentAccordionComponent } from 'src/app/components/attachment-accordion/attachment-accordion.component';
import { IChapterInfo } from './model/chapter-info';
import { CourseUploadService } from './course-upload.service';
import { IMainCourseInfo } from './model/course-info';
import { Subject } from 'rxjs';
import { ICourseList } from '../courses/modal/course-list';
import { IFileObjectInfo } from './model/file-object-info';
import { CommonService } from 'src/app/shared/services/common.service';
import { COMPONENT_NAME } from 'src/app/constants/popup-constants';
@Component({
  selector: 'app-course-upload',
  standalone: true,
  imports: [FormsModule, CommonModule, AttachmentAccordionComponent],
  templateUrl: './course-upload.component.html',
  styleUrl: './course-upload.component.scss',
})
export class CourseUploadComponent {
  public mobMenu: boolean = false;
  private destroy$ = new Subject<void>();
  public mainCourseInfo: IMainCourseInfo;
  public courseChapterList: IChapterInfo[] = [];
  public lastUpdatedCourse: ICourseList[] = [];
  constructor(
    private courseUploadService: CourseUploadService,
    private commonService: CommonService
  ) {
    this.mainCourseInfo = { ...this.courseUploadService.MAIN_COURSE_INFO };
    this.addNewChapter();
    this.fetchLastUpdatedCourses();
  }
  @ViewChild('btnTrigger', { static: true }) btnTrigger!: ElementRef<HTMLButtonElement>;
  triggerMenu() {
    this.btnTrigger.nativeElement.click();
    this.mobMenu = false;
  }
  mobileMenu() {
    this.mobMenu = !this.mobMenu;
  }
  async addNewVideoList(chapter: IChapterInfo) {
    const isValid = await this.courseUploadService.courseSaveValidation({
      mainCourseInfo: this.mainCourseInfo,
      chapterInfo: this.courseChapterList,
    });
    if (isValid) {
      chapter.fileDetails = chapter.fileDetails.concat({
        ...this.courseUploadService.FILE_OBJECT_INFO,
      });
    }
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
  async onFileSelected(
    event: Event,
    uploadType: string,
    mainIndex?: number,
    videoDetailsIndex?: number
  ): Promise<void> {
    const target = event.target as HTMLInputElement;
    const files = target.files as FileList;
    const fileUrl = await this.courseUploadService.onFileUpload(
      this.destroy$,
      files[0],
      uploadType
    );
    switch (uploadType) {
      case 'COVER_IMAGE':
        this.mainCourseInfo.courseCoverImage = fileUrl;
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
    const isCourseUploaded = await this.courseUploadService.saveCourseDetails(
      {
        mainCourseInfo: this.mainCourseInfo,
        chapterInfo: this.courseChapterList,
      },
      this.destroy$
    );
    if (isCourseUploaded) {
      this.courseChapterList = [];
      this.addNewChapter();
      this.mainCourseInfo = { ...this.courseUploadService.MAIN_COURSE_INFO };
      this.fetchLastUpdatedCourses();
    }
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  private async fetchLastUpdatedCourses() {
    this.lastUpdatedCourse = await this.courseUploadService.fetchUploadedCourses();
  }
  handleCourseEdit(courseInfo: ICourseList) {
    this.mainCourseInfo = {
      _id: courseInfo._id,
      courseCoverImage: courseInfo.courseCoverImage,
      courseTitle: courseInfo.courseTitle,
      courseDescription: courseInfo.courseDescription,
    };
    this.courseChapterList = courseInfo.chapterDetails as any;
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
}