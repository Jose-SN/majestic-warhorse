import { CommonSliderComponent } from './../../components/common-slider/common-slider.component';
import { Component, ViewChild, ElementRef, ViewChildren, QueryList, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AttachmentAccordionComponent } from 'src/app/components/attachment-accordion/attachment-accordion.component';
import { IChapterInfo } from './model/chapter-info';
import { CourseUploadService } from './course-upload.service';
import { IMainCourseInfo } from './model/course-info';
import { Subject } from 'rxjs';
@Component({
  selector: 'app-course-upload',
  standalone: true,
  imports: [FormsModule, CommonModule, CommonSliderComponent, AttachmentAccordionComponent],
  templateUrl: './course-upload.component.html',
  styleUrl: './course-upload.component.scss',
})
export class CourseUploadComponent {
  public mobMenu: boolean = false;
  private destroy$ = new Subject<void>();
  public mainCourseInfo: IMainCourseInfo;
  public courseChapterList: IChapterInfo[] = [];
  constructor(private courseUploadService: CourseUploadService) {
    this.mainCourseInfo = { ...this.courseUploadService.MAIN_COURSE_INFO };
    this.addNewChapter();
  }
  @ViewChild('btnTrigger', { static: true }) btnTrigger!: ElementRef<HTMLButtonElement>;
  triggerMenu() {
    this.btnTrigger.nativeElement.click();
    this.mobMenu = false;
  }
  mobileMenu() {
    this.mobMenu = !this.mobMenu;
  }
  addNewVideoList(chapter: IChapterInfo) {
    chapter.fileDetails = chapter.fileDetails.concat({
      ...this.courseUploadService.FILE_OBJECT_INFO,
    });
  }
  addNewChapter() {
    this.courseChapterList = this.courseChapterList.concat({
      ...this.courseUploadService.CHAPTER_INFO,
    });
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
    console.log(mainIndex, videoDetailsIndex);
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
          this.courseChapterList[mainIndex].attachments =
            this.courseChapterList[mainIndex].attachments.concat(fileUrl);
        }
        break;
      case 'VIDEO_FILE':
        if ((mainIndex || mainIndex == 0) && this.courseChapterList[mainIndex]) {
          if (
            (videoDetailsIndex || videoDetailsIndex == 0) &&
            this.courseChapterList[mainIndex].fileDetails[videoDetailsIndex]
          ) {
            this.courseChapterList[mainIndex].fileDetails[videoDetailsIndex].fileURL = fileUrl;
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
    if(isCourseUploaded){
      this.courseChapterList = [];
      this.addNewChapter();
      this.mainCourseInfo = { ...this.courseUploadService.MAIN_COURSE_INFO };
    }
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
