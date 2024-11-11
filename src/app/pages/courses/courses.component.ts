import { Component, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CoursesService } from './courses.service';
import { Observable, of } from 'rxjs';
import { ICourseList } from './modal/course-list';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { CommonSliderComponent } from 'src/app/components/common-slider/common-slider.component';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [FormsModule, CommonModule,CommonSliderComponent],
  templateUrl: './courses.component.html',
  styleUrl: './courses.component.scss',
})
export class CoursesComponent {
  public profileUrl: string = "";
  public mobMenu: boolean = false;
  public showSliderView: boolean = false;
  @Output() emitCourseDetails = new EventEmitter<{ [key: string]: boolean | ICourseList }>();
  public courseList$: Observable<ICourseList[]> = of([]);
  @ViewChild('btnTrigger', { static: true }) btnTrigger!: ElementRef<HTMLButtonElement>;
  constructor(private coursesService: CoursesService,private authService:AuthService,
    private commonService: CommonService
  ) {
    this.courseList$ = this.coursesService.getCourseList();
    this.profileUrl = this.commonService.loginedUserInfo.profileImage ?? '';
  }
  triggerMenu() {
    this.btnTrigger.nativeElement.click();
    this.mobMenu = false;
  }
  mobileMenu() {
    this.mobMenu = !this.mobMenu;
  }
  openCourseDetailsPage(selectedCourse: ICourseList) {
    this.emitCourseDetails.emit({ selectedCourse: selectedCourse, showCourseDetail: true });
  }
  logOut(){
    this.authService.logOutApplication();
  }
  sliderActiveRemove(): void {
    this.showSliderView = false;
  }
}
