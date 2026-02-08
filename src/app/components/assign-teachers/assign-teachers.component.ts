import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { UserModel } from 'src/app/pages/login-page/model/user-model';
import { AssignTeacherService } from './assign-teacher.service';
import { IModelInfo } from '../common-dialog/model/popupmodel';
import { Subject, takeUntil, switchMap } from 'rxjs';
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
    public commonService: CommonService,
    private authService: AuthService,
    private assignTeacherService: AssignTeacherService
  ) {
    this.teachersList = this.commonService.allUsersList.filter((users) => users.role === 'teacher');
    this.selectedItems = [];
    this.dropdownSettings = {
      singleSelection: false,
      idField: 'id',
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
  getTeacherId(teacher: UserModel): string {
    return teacher.id || '';
  }
  
  onTeacherSelect(teacher: any, event: Event) {
    const input = event.target as HTMLInputElement;
    const isChecked = input.checked;
    const teacherId = this.getTeacherId(teacher);
    if (isChecked) {
      if (!this.selectedTeachers.includes(teacherId)) {
        this.selectedTeachers.push(teacherId);
      }
    } else {
      const index = this.selectedTeachers.indexOf(teacherId);
      if (index > -1) {
        this.selectedTeachers.splice(index, 1);
      }
    }
  }
  handleTeacherAssign() {
    const studentId = this.popupModelInfo.data.id;
    const student = this.popupModelInfo.data;
    const payload = [
      {
        student_id: studentId,
        teacher_ids: this.selectedTeachers
      }
    ];
    
    this.assignTeacherService
      .assignTeachersToStudent(payload)
      .pipe(
        switchMap((result) => {
          if (result.success) {
            // Update user status to approved
            const updatePayload = {
              id: studentId,
              status: 'active',
              ...student
            };
            return this.authService.updateUserInfo(updatePayload);
          } else {
            throw new Error('Failed to assign teachers');
          }
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (updateResult) => {
          // Update local user list
          const userIndex = this.commonService.allUsersList.findIndex(
            (user) => user.id === studentId
          );
          if (userIndex > -1) {
            this.commonService.allUsersList[userIndex].status = 'active';
          }
          
          this.commonService.openToaster({
            message: 'Teachers assigned successfully!',
            messageType: TOASTER_MESSAGE_TYPE.SUCCESS,
          });
          this.commonService.closePopupModel(true);
        },
        error: () => {
          this.commonService.openToaster({
            message: 'Error while assigning teachers, please contact admin',
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
