import {  Component} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CourseUploadComponent } from 'src/app/pages/course-upload/course-upload.component';
@Component({
  selector: 'app-common-slider',
  standalone: true,
  imports: [FormsModule, CommonModule, CourseUploadComponent],
  templateUrl: './common-slider.component.html',
  styleUrl: './common-slider.component.scss'
})
export class CommonSliderComponent {
}
