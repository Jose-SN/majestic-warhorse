import { Component, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-course-upload',
  standalone: true,
  imports: [FormsModule,CommonModule],
  templateUrl: './course-upload.component.html',
  styleUrl: './course-upload.component.scss'
})
export class CourseUploadComponent {
  public mobMenu: boolean = false;
  @ViewChild('btnTrigger', { static: true }) btnTrigger!: ElementRef<HTMLButtonElement>;
  triggerMenu() {
    this.btnTrigger.nativeElement.click();
    this.mobMenu = false;
  }
  mobileMenu() {
    this.mobMenu = !this.mobMenu;
  }
  
}
