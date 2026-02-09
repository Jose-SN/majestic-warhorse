import {  Component, Output, EventEmitter, ViewChild, Input, OnChanges, SimpleChanges} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CourseUploadComponent } from 'src/app/pages/course-upload/course-upload.component';
import { ICourseList } from 'src/app/pages/courses/modal/course-list';
@Component({
  selector: 'app-common-slider',
  standalone: true,
  imports: [FormsModule, CommonModule, CourseUploadComponent],
  templateUrl: './common-slider.component.html',
  styleUrl: './common-slider.component.scss'
})
export class CommonSliderComponent implements OnChanges {
  @Input() courseData: ICourseList | null = null;
  @Output() removeClass = new EventEmitter<void>();
  @ViewChild(CourseUploadComponent) courseUploadComponent!: CourseUploadComponent;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['courseData'] && this.courseData) {
      // Store courseData in a local variable to preserve type narrowing
      const courseData = this.courseData;
      // Use setTimeout to ensure ViewChild is initialized
      setTimeout(() => {
        if (this.courseUploadComponent && courseData) {
          this.courseUploadComponent.handleCourseEdit(courseData);
        }
      }, 0);
    }
  }

  sliderRemoveAction(): void {
    this.removeClass.emit();
    this.courseUploadComponent.clearPage();
  }
}
