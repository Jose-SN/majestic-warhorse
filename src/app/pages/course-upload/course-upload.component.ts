import { CommonSliderComponent } from './../../components/common-slider/common-slider.component';
import { Component, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AttachmentAccordionComponent } from 'src/app/components/attachment-accordion/attachment-accordion.component';
import { IChapterInfo } from './model/chapter-info';
import { CourseUploadService } from './course-upload.service';
import { IMainCourseInfo } from './model/course-info';
@Component({
  selector: 'app-course-upload',
  standalone: true,
  imports: [FormsModule, CommonModule, CommonSliderComponent,AttachmentAccordionComponent],
  templateUrl: './course-upload.component.html',
  styleUrl: './course-upload.component.scss',
})
export class CourseUploadComponent {
  public mobMenu: boolean = false;
  public mainCourseInfo: IMainCourseInfo;
  public courseChapterList: IChapterInfo[] = [];
  constructor(private courseUploadService: CourseUploadService) {
    this.mainCourseInfo = this.courseUploadService.MAIN_COURSE_INFO;
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
    chapter.fileDetails = chapter.fileDetails.concat(this.courseUploadService.FILE_OBJECT_INFO);
  }
  addNewChapter() {
    this.courseChapterList = this.courseChapterList.concat(this.courseUploadService.CHAPTER_INFO);
  }
}
