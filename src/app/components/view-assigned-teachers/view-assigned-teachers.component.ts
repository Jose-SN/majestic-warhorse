import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonService } from 'src/app/shared/services/common.service';
import { UserModel } from 'src/app/pages/login-page/model/user-model';
import { AssignTeacherService } from '../assign-teachers/assign-teacher.service';
import { IModelInfo } from '../common-dialog/model/popupmodel';
import { Subject, takeUntil } from 'rxjs';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';

@Component({
  selector: 'app-view-assigned-teachers',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './view-assigned-teachers.component.html',
  styleUrl: './view-assigned-teachers.component.scss',
})
export class ViewAssignedTeachersComponent implements OnInit {
  teachersList: UserModel[] = [];
  assignedTeachers: UserModel[] = [];
  selectedTeachers: string[] = [];
  @Input() popupModelInfo: IModelInfo = {} as IModelInfo;
  private destroy$ = new Subject<void>();
  isLoading: boolean = false;

  constructor(
    public commonService: CommonService,
    private assignTeacherService: AssignTeacherService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadTeachers();
    this.loadAssignedTeachers();
  }

  loadTeachers() {
    this.teachersList = this.commonService.allUsersList.filter(
      (users) => users.role === 'teacher'
    );
  }

  loadAssignedTeachers() {
    const studentId = this.popupModelInfo?.data?.id;
    if (!studentId) {
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.assignTeacherService
      .getAssignedTeachers(studentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.isLoading = false;
          const responseData = result?.data ?? result;
          const assignments = Array.isArray(responseData) ? responseData : [];
          const teacherIds = assignments
            .map((a: { teacher_id?: string; id?: string }) => a.teacher_id || a.id || '')
            .filter((id: string) => !!id);
          this.selectedTeachers = teacherIds;
          this.assignedTeachers = teacherIds
            .map((id) => this.commonService.allUsersList.find((u) => (u.id || '') === id))
            .filter((u): u is UserModel => !!u);
          this.cdr.detectChanges();
        },
        error: () => {
          this.isLoading = false;
          this.cdr.detectChanges();
          this.commonService.openToaster({
            message: 'Error loading assigned teachers',
            messageType: TOASTER_MESSAGE_TYPE.ERROR,
          });
        },
      });
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

  handleTeacherUpdate() {
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
              message: 'Teachers updated successfully!',
              messageType: TOASTER_MESSAGE_TYPE.SUCCESS,
            });
            this.commonService.closePopupModel(true);
          } else {
            this.commonService.openToaster({
              message: 'Error while updating teachers, please contact your organization',
              messageType: TOASTER_MESSAGE_TYPE.ERROR,
            });
          }
        },
        error: () => {
          this.commonService.openToaster({
            message: 'Error while updating teachers, please contact your organization',
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
