import { Injectable } from '@angular/core';
import { map, Observable, switchMap } from 'rxjs';
import {
  ApprovalNotificationService,
  StudentApprovalRecipient,
} from 'src/app/services/approval-notification.service';
import { TeachersApiService } from 'src/app/services/api-service/teachers-api.service';
import { StudentsApiService } from 'src/app/services/api-service/students-api.service';

@Injectable({
  providedIn: 'root',
})
export class ApproveTeacherService {
  constructor(
    private teachersApi: TeachersApiService,
    private studentsApi: StudentsApiService,
    private approvalNotification: ApprovalNotificationService
  ) {}

  /** Approve pending teachers by roster row ids (course backend). */
  approveTeachers(rosterRowIds: string[]): Observable<unknown> {
    if (rosterRowIds.length === 1) {
      return this.teachersApi.approveTeacher(rosterRowIds[0], 'active');
    }
    return this.teachersApi.approveTeachersBulk(rosterRowIds, 'active');
  }

  /** Approve pending students by roster row ids (course backend). */
  approveStudents(
    rosterRowIds: string[],
    recipients: StudentApprovalRecipient[] = []
  ): Observable<unknown> {
    const approval$ =
      rosterRowIds.length === 1
        ? this.studentsApi.approveStudent(rosterRowIds[0], 'active')
        : this.studentsApi.approveStudentsBulk(rosterRowIds, 'active');

    const emailRecipients = this.resolveStudentRecipients(rosterRowIds, recipients);

    return approval$.pipe(
      switchMap((response) =>
        this.approvalNotification.sendStudentApprovalEmails(emailRecipients).pipe(map(() => response))
      )
    );
  }

  private resolveStudentRecipients(
    rosterRowIds: string[],
    recipients: StudentApprovalRecipient[]
  ): StudentApprovalRecipient[] {
    if (recipients.length) {
      return recipients.filter((recipient) => rosterRowIds.includes(recipient.rosterRowId));
    }

    return rosterRowIds.map((rosterRowId) => ({ rosterRowId }));
  }
}
