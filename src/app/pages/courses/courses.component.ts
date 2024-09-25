import { Component, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CoursesService } from './courses.service';
import { Observable, of, Subject } from 'rxjs';
import { ICourseList } from './modal/course-list';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './courses.component.html',
  styleUrl: './courses.component.scss',
})
export class CoursesComponent {
  public mobMenu: boolean = false;
  public courseList$: Observable<ICourseList[]> = of([]);
  private destroy$ = new Subject<void>();
  @ViewChild('btnTrigger', { static: true }) btnTrigger!: ElementRef<HTMLButtonElement>;
  constructor(private coursesService: CoursesService) {
    this.courseList$ = this.coursesService.getCourseList();
  }
  triggerMenu() {
    this.btnTrigger.nativeElement.click();
    this.mobMenu = false;
  }
  mobileMenu() {
    this.mobMenu = !this.mobMenu;
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
