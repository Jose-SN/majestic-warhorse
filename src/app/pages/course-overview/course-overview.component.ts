import { Component, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AsyncPipe, CommonModule } from '@angular/common';
import { CommonSliderComponent } from 'src/app/components/common-slider/common-slider.component';
import { of } from 'rxjs';
import { CoursesService } from '../courses/courses.service';
import { CourseUploadService } from '../course-upload/course-upload.service';
import { ICourseList } from '../courses/modal/course-list';

@Component({
  selector: 'app-course-overview',
  standalone: true,
  imports: [FormsModule, CommonModule, CommonSliderComponent, AsyncPipe],
  templateUrl: './course-overview.component.html',
  styleUrl: './course-overview.component.scss',
})
export class CourseOverviewComponent {
  public mobMenu: boolean = false;
  public showSliderView: boolean = false;
  public courseLists: ICourseList[] = [];
  @ViewChild('btnTrigger', { static: true }) btnTrigger!: ElementRef<HTMLButtonElement>;
  constructor(
    private courseUploadService: CourseUploadService
  ) {
    this.fetchCourseList();
  }
  triggerMenu() {
    this.btnTrigger.nativeElement.click();
    this.mobMenu = false;
  }
  mobileMenu() {
    this.mobMenu = !this.mobMenu;
  }
  openCourseUploadSlider() {
    this.showSliderView = !this.showSliderView;
  }
  sliderActiveRemove(): void {
    this.showSliderView = false;
  }
  async fetchCourseList() {
    this.courseLists = await this.courseUploadService.fetchUploadedCourses();
  }
}
