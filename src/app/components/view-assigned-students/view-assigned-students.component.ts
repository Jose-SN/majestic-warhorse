import {
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CommonService } from 'src/app/shared/services/common.service';
import { AssignTeacherService } from '../assign-teachers/assign-teacher.service';
import { IModelInfo } from '../common-dialog/model/popupmodel';
import { RosterDisplayService, RosterDisplayUser } from 'src/app/services/api-service/roster-display.service';
import { Subject, takeUntil, switchMap } from 'rxjs';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';

@Component({
  selector: 'app-view-assigned-students',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './view-assigned-students.component.html',
  styleUrl: './view-assigned-students.component.scss',
})
export class ViewAssignedStudentsComponent implements OnInit, OnDestroy {
  studentsList: RosterDisplayUser[] = [];
  assignedStudents: RosterDisplayUser[] = [];
  selectedStudents: string[] = [];
  initiallyAssignedStudentIds: string[] = [];
  @Input() popupModelInfo: IModelInfo = {} as IModelInfo;
  private destroy$ = new Subject<void>();
  isLoading: boolean = false;

  constructor(
    public commonService: CommonService,
    private assignTeacherService: AssignTeacherService,
    private rosterDisplay: RosterDisplayService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const orgId = sessionStorage.getItem('organization_id') || '';
    if (orgId) {
      this.rosterDisplay.loadStudents(orgId, 'active').then((students) => {
        this.studentsList = students;
        this.updateAssignedStudentsFromIds();
        this.cdr.detectChanges();
      });
    }
    this.loadAssignedStudents();
  }

  private updateAssignedStudentsFromIds(): void {
    this.assignedStudents = this.selectedStudents
      .map((id) => this.studentsList.find((u) => (u.id || '') === id))
      .filter((u): u is RosterDisplayUser => !!u);
  }

  loadAssignedStudents() {
    const teacherId = this.popupModelInfo?.data?.id;
    if (!teacherId) {
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.assignTeacherService
      .getAssignedStudents(teacherId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.isLoading = false;
          const responseData = result?.data ?? result;
          let studentIds: string[] = [];

          if (responseData) {
            if (Array.isArray(responseData) && responseData.length > 0) {
              studentIds = responseData
                .map((item: any) => item.student_id || item.id || '')
                .filter((id: string) => !!id);
            } else if (responseData.student_ids && Array.isArray(responseData.student_ids)) {
              studentIds = responseData.student_ids;
            } else if (responseData.students && Array.isArray(responseData.students)) {
              studentIds = responseData.students
                .map((student: any) => student.student_id || student.id || '')
                .filter((id: string) => !!id);
            }
          }

          this.selectedStudents = [...studentIds];
          this.initiallyAssignedStudentIds = [...studentIds];
          this.updateAssignedStudentsFromIds();
          this.cdr.detectChanges();
        },
        error: () => {
          this.isLoading = false;
          this.cdr.detectChanges();
          this.commonService.openToaster({
            message: 'Error loading assigned students',
            messageType: TOASTER_MESSAGE_TYPE.ERROR,
          });
        },
      });
  }

  getStudentId(student: RosterDisplayUser): string {
    return student.id || '';
  }

  isAssigned(student: RosterDisplayUser): boolean {
    return this.selectedStudents.includes(this.getStudentId(student));
  }

  wasInitiallyAssigned(student: RosterDisplayUser): boolean {
    return (
      this.initiallyAssignedStudentIds.includes(this.getStudentId(student)) &&
      this.selectedStudents.includes(this.getStudentId(student))
    );
  }

  isUnassigning(student: RosterDisplayUser): boolean {
    const id = this.getStudentId(student);
    return (
      this.initiallyAssignedStudentIds.includes(id) &&
      !this.selectedStudents.includes(id)
    );
  }

  hasPendingChanges(): boolean {
    const hasUnassigns = this.initiallyAssignedStudentIds.some(
      (id) => !this.selectedStudents.includes(id)
    );
    const hasNewAssigns = this.selectedStudents.some(
      (id) => !this.initiallyAssignedStudentIds.includes(id)
    );
    return hasUnassigns || hasNewAssigns;
  }

  onStudentSelect(student: RosterDisplayUser, event: Event) {
    const input = event.target as HTMLInputElement;
    const isChecked = input.checked;
    const studentId = this.getStudentId(student);
    if (isChecked) {
      if (!this.selectedStudents.includes(studentId)) {
        this.selectedStudents.push(studentId);
      }
    } else {
      const index = this.selectedStudents.indexOf(studentId);
      if (index > -1) {
        this.selectedStudents.splice(index, 1);
      }
    }
  }

  handleStudentUpdate() {
    const teacherId = this.popupModelInfo.data.id;
    const unassignStudentIds = this.initiallyAssignedStudentIds.filter(
      (id) => !this.selectedStudents.includes(id)
    );

    const assignPayload = [
      {
        teacher_id: teacherId,
        student_ids: this.selectedStudents,
        ...(unassignStudentIds.length > 0 && {
          unassign_student_ids: unassignStudentIds,
        }),
      },
    ];

    const update$ =
      unassignStudentIds.length > 0
        ? this.assignTeacherService
            .unassignStudentsFromTeacher({
              teacher_id: teacherId,
              unassign_student_ids: unassignStudentIds,
            })
            .pipe(
              switchMap(() =>
                this.assignTeacherService.assignStudentsToTeacher(assignPayload)
              )
            )
        : this.assignTeacherService.assignStudentsToTeacher(assignPayload);

    update$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => {
        if (result.success) {
          this.commonService.openToaster({
            message: 'Students updated successfully!',
            messageType: TOASTER_MESSAGE_TYPE.SUCCESS,
          });
          this.commonService.closePopupModel(true);
        } else {
          this.commonService.openToaster({
            message: 'Error while updating students, please contact your organization',
            messageType: TOASTER_MESSAGE_TYPE.ERROR,
          });
        }
      },
      error: () => {
        this.commonService.openToaster({
          message: 'Error while updating students, please contact your organization',
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
