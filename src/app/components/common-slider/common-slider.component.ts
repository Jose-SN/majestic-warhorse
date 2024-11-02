import { Component } from '@angular/core';
import { CourseUploadComponent } from './../../pages/course-upload/course-upload.component';
@Component({
  selector: 'app-common-slider',
  standalone: true,
  imports: [CourseUploadComponent],
  templateUrl: './common-slider.component.html',
  styleUrl: './common-slider.component.scss',
})
export class CommonSliderComponent {}
