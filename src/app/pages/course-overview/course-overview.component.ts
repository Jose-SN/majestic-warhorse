import { Component, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CommonSliderComponent } from 'src/app/components/common-slider/common-slider.component';

@Component({
  selector: 'app-course-overview',
  standalone: true,
  imports: [FormsModule, CommonModule, CommonSliderComponent],
  templateUrl: './course-overview.component.html',
  styleUrl: './course-overview.component.scss',
})
export class CourseOverviewComponent {
  public mobMenu: boolean = false;
  public showSliderView: boolean = false;
  @ViewChild('btnTrigger', { static: true }) btnTrigger!: ElementRef<HTMLButtonElement>;
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
}
