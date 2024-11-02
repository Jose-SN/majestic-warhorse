import { CommonSliderComponent } from './../../components/common-slider/common-slider.component';
import { Component, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-course-upload',
  standalone: true,
  imports: [FormsModule, CommonModule, CommonSliderComponent],
  templateUrl: './course-upload.component.html',
  styleUrl: './course-upload.component.scss',
})
export class CourseUploadComponent {
  public mobMenu: boolean = false;
  public commonSliderClose = true;
  public chapterList = [
    {
      attachments: [],
      chapterTitle: '',
      fileDetails: [{ name: '', url: '', chapterDescription: '' }],
    },
  ];
  @ViewChild('btnTrigger', { static: true }) btnTrigger!: ElementRef<HTMLButtonElement>;
  triggerMenu() {
    this.btnTrigger.nativeElement.click();
    this.mobMenu = false;
  }
  mobileMenu() {
    this.mobMenu = !this.mobMenu;
  }

  commonSlideClose() {
    this.commonSliderClose = false;
  }
  addNewVideoList(chapter: any) {
    chapter.fileDetails = chapter.fileDetails.concat({ name: '', url: '', chapterDescription: '' });
  }
  addNewChapter() {
    this.chapterList = this.chapterList.concat({
      attachments: [],
      chapterTitle: '',
      fileDetails: [{ name: '', url: '', chapterDescription: '' }],
    });
  }
}
