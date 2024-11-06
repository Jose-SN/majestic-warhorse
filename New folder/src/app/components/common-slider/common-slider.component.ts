import {  Component, Output, EventEmitter} from '@angular/core';
import { AttachmentAccordionComponent } from 'src/app/components/attachment-accordion/attachment-accordion.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CourseUploadComponent } from "../../pages/course-upload/course-upload.component";
@Component({
  selector: 'app-common-slider',
  standalone: true,
  imports: [FormsModule, CommonModule, CommonSliderComponent, AttachmentAccordionComponent, CourseUploadComponent],
  templateUrl: './common-slider.component.html',
  styleUrl: './common-slider.component.scss'
})
export class CommonSliderComponent {
  public chapterList = [
    {
      attachments: [],
      chapterTitle: '',
      fileDetails: [{ name: '', url: '', chapterDescription: '' }],
    },
  ];

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
