import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CourseUploadService } from 'src/app/pages/course-upload/course-upload.service';
import { ICourseList } from 'src/app/pages/courses/modal/course-list';

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './dashboard-overview.component.html',
  styleUrl: './dashboard-overview.component.scss',
})
export class DashboardOverviewComponent {
  public mobMenu: boolean = false;
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
  async fetchCourseList() {
    this.courseLists = await this.courseUploadService.fetchUploadedCourses();
  }
}
