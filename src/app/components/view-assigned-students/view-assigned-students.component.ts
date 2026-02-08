import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CommonService } from 'src/app/shared/services/common.service';
import { UserModel } from 'src/app/pages/login-page/model/user-model';
import { AssignTeacherService } from '../assign-teachers/assign-teacher.service';
import { IModelInfo } from '../common-dialog/model/popupmodel';
import { Subject, takeUntil } from 'rxjs';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';

@Component({
  selector: 'app-view-assigned-students',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './view-assigned-students.component.html',
  styleUrl: './view-assigned-students.component.scss',
})
export class ViewAssignedStudentsComponent implements OnInit, OnDestroy {
  studentsList: UserModel[] = [];
  assignedStudents: UserModel[] = [];
  @Input() popupModelInfo: IModelInfo = {} as IModelInfo;
  private destroy$ = new Subject<void>();
  isLoading: boolean = false;

  constructor(
    public commonService: CommonService,
    private assignTeacherService: AssignTeacherService
  ) {}

  ngOnInit() {
    this.loadStudents();
    this.loadAssignedStudents();
  }

  loadStudents() {
    this.studentsList = this.commonService.allUsersList.filter(
      (users) => users.role === 'student'
    );
  }

  loadAssignedStudents() {
    const teacherId = this.popupModelInfo.data.id;
    if (!teacherId) return;

    this.isLoading = true;
    this.assignTeacherService
      .getAssignedStudents(teacherId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.isLoading = false;
          const responseData = result.data || result;
          if (responseData) {
            let studentIds: string[] = [];
            
            // Handle different response structures
            if (Array.isArray(responseData) && responseData.length > 0) {
              studentIds = responseData.map((student: any) => student.id || student.student_id || '');
            } else if (responseData.student_ids && Array.isArray(responseData.student_ids)) {
              studentIds = responseData.student_ids;
            } else if (responseData.students && Array.isArray(responseData.students)) {
              studentIds = responseData.students.map((student: any) => student.id || student.student_id || '');
            }
            
            // Map assigned student IDs to student objects
            this.assignedStudents = this.studentsList.filter((student) =>
              studentIds.includes(student.id || '')
            );
          }
        },
        error: () => {
          this.isLoading = false;
          this.commonService.openToaster({
            message: 'Error loading assigned students',
            messageType: TOASTER_MESSAGE_TYPE.ERROR,
          });
        },
      });
  }

  getStudentId(student: UserModel): string {
    return student.id || '';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
