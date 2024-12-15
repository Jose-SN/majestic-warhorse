import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { UserModel } from 'src/app/pages/login-page/model/user-model';
import { AssignTeacherService } from './assign-teacher.service';
import { IModelInfo } from '../common-dialog/model/popupmodel';
import { Subject, takeUntil } from 'rxjs';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';

@Component({
  selector: 'app-assign-teachers',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './assign-teachers.component.html',
  styleUrl: './assign-teachers.component.scss',
})
export class AssignTeachersComponent {
  teachersList: UserModel[] = [];
  selectedTeachers: string[] = [];
  selectedItems: UserModel[] = [];
  dropdownSettings: any = {};
  @Input() popupModelInfo: IModelInfo = {} as IModelInfo;
  private destroy$ = new Subject<void>();

  public mobMenu: boolean = false;
  public showSliderView: boolean = false;
  @ViewChild('btnTrigger', { static: true }) btnTrigger!: ElementRef<HTMLButtonElement>;

  constructor(
    private commonService: CommonService,
    private authService: AuthService,
    private assignTeacherService: AssignTeacherService
  ) {
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
  onTeacherSelect(teacher: any, event: Event) {
    const input = event.target as HTMLInputElement;
    const isChecked = input.checked;
    if (isChecked) {
      this.selectedTeachers.push(teacher._id);
    } else {
      const index = this.selectedTeachers.indexOf(teacher._id);
      if (index > -1) {
        this.selectedTeachers.splice(index, 1);
      }
    }
  }
  handleTeacherAssign() {
    this.assignTeacherService
      .assignTeachersToStudent([
        { id: this.popupModelInfo.data._id, assignedTo: this.selectedTeachers },
      ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.success) {
            this.commonService.openToaster({
              message: 'Teachers assign successfully done!',
              messageType: TOASTER_MESSAGE_TYPE.SUCCESS,
            });
            this.commonService.closePopupModel(true);
          } else {
            this.commonService.openToaster({
              message: 'Error while assiging teacher, please contact admin',
              messageType: TOASTER_MESSAGE_TYPE.ERROR,
            });
          }
        },
        error: () => {
          this.commonService.openToaster({
            message: 'Error while assiging teacher, please contact admin',
            messageType: TOASTER_MESSAGE_TYPE.ERROR,
          });
        },
      });
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
