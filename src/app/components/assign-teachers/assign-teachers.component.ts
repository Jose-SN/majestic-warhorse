import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { CommonSearchProfileComponent } from "../common-search-profile/common-search-profile.component";

@Component({
  selector: 'app-assign-teachers',
  standalone: true,
  imports: [NgMultiSelectDropDownModule, FormsModule, CommonSearchProfileComponent],
  templateUrl: './assign-teachers.component.html',
  styleUrl: './assign-teachers.component.scss',
})
export class AssignTeachersComponent {
  teachersList: any = [];
  selectedTeachers: any = [];
  selectedItems: any = [];
  dropdownSettings: any = {};
  public mobMenu: boolean = false;
  public showSliderView: boolean = false;
    @ViewChild('btnTrigger', { static: true }) btnTrigger!: ElementRef<HTMLButtonElement>;

  constructor(private commonService: CommonService,
      private authService: AuthService,) {
    this.teachersList = this.commonService.allUsersList.filter((users) => users.role === 'teacher');
    this.selectedItems = [];
    this.dropdownSettings = {
      singleSelection: false,
      idField: '_id',
      textField: 'firstName',
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      itemsShowLimit: 3,
      allowSearchFilter: true,
    };
  }
  
  triggerMenu() {
    this.btnTrigger.nativeElement.click();
    this.mobMenu = false;
  }
  mobileMenu() {
    this.mobMenu = !this.mobMenu;
  }

  logOut() {
    this.authService.logOutApplication();
  }
  sliderActiveRemove(): void {
    this.showSliderView = false;
  }
  seachTextHandler(searchText:string){

  }
}
