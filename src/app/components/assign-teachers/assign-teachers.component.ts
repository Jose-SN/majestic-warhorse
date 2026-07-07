import { Component, ElementRef, Input, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { UserModel } from 'src/app/pages/login-page/model/user-model';
import { AssignTeacherService } from './assign-teacher.service';
import { IModelInfo } from '../common-dialog/model/popupmodel';
import { Subject, takeUntil } from 'rxjs';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';
import { RosterDisplayService } from 'src/app/services/api-service/roster-display.service';

@Component({
  selector: 'app-assign-teachers',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './assign-teachers.component.html',
  styleUrl: './assign-teachers.component.scss',
})
export class AssignTeachersComponent implements OnInit, OnDestroy {
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
    private assignTeacherService: AssignTeacherService,
    private rosterDisplay: RosterDisplayService
  ) {
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

  ngOnInit(): void {
    const orgId = sessionStorage.getItem('organization_id') || '';
    if (orgId) {
      this.rosterDisplay.loadTeachers(orgId, 'approved').then((teachers) => {
        this.teachersList = teachers;
      });
    }
    this.loadAssignedTeachers();
  }

  private loadAssignedTeachers(): void {
    const studentId = this.popupModelInfo?.data?.id;
    if (!studentId) return;

    this.assignTeacherService
      .getAssignedTeachers(studentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          const responseData = result?.data ?? result;
          let teacherIds: string[] = [];

          if (Array.isArray(responseData)) {
            teacherIds = responseData
              .map((item: any) => item.teacher_id || item.id || '')
              .filter((id: string) => !!id);
          } else if (responseData?.teacher_ids) {
            teacherIds = responseData.teacher_ids;
          }

          this.selectedTeachers = [...teacherIds];
        },
      });
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
    const payload = [
      {
        student_id: studentId,
        teacher_ids: this.selectedTeachers,
      },
    ];

    this.assignTeacherService
      .assignTeachersToStudent(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.success) {
            this.commonService.openToaster({
              message: 'Teachers assigned successfully!',
              messageType: TOASTER_MESSAGE_TYPE.SUCCESS,
            });
            this.commonService.closePopupModel(true);
          } else {
            this.commonService.openToaster({
              message: 'Error while assigning teachers, please contact your organization',
              messageType: TOASTER_MESSAGE_TYPE.ERROR,
            });
          }
        },
        error: () => {
          this.commonService.openToaster({
            message: 'Error while assigning teachers, please contact your organization',
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
