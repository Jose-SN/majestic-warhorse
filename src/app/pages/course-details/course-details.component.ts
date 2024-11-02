import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-course-detils',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './course-details.component.html',
  styleUrl: './course-details.component.scss',
})
export class CourseDetailsComponent implements OnInit {
  public mobMenu: boolean = false;
  @ViewChild('btnTrigger', { static: true }) btnTrigger!: ElementRef<HTMLButtonElement>;
  ngOnInit(): void {
    this.selectedItem = this.menuItems[0];
  }

  triggerMenu() {
    this.btnTrigger.nativeElement.click();
    this.mobMenu = false;
  }
  mobileMenu() {
    this.mobMenu = !this.mobMenu;
  }
  menuItems: string[] = [
    'Introduction',
    'Class & Project Overview',
    'The Design Process',
    'Task: Ideation in your Kitchen',
    'Introduction1',
    'Class & Project Overview1',
    'The Design Process1',
    'Task: Ideation in your Kitchen1',
  ];
  selectedItem: string | null = null;
  selectItem(listItem: string): void {
    this.selectedItem = listItem;
  }
}
