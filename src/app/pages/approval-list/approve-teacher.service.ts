import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TeachersApiService } from 'src/app/services/api-service/teachers-api.service';
import { StudentsApiService } from 'src/app/services/api-service/students-api.service';

@Injectable({
  providedIn: 'root',
})
export class ApproveTeacherService {
  constructor(
    private teachersApi: TeachersApiService,
    private studentsApi: StudentsApiService
  ) {}

  /** Approve pending teachers by roster row ids (course backend). */
  approveTeachers(rosterRowIds: string[]): Observable<unknown> {
    if (rosterRowIds.length === 1) {
      return this.teachersApi.approveTeacher(rosterRowIds[0], 'active');
    }
    return this.teachersApi.approveTeachersBulk(rosterRowIds, 'active');
  }

  /** Approve pending students by roster row ids (course backend). */
  approveStudents(rosterRowIds: string[]): Observable<unknown> {
    if (rosterRowIds.length === 1) {
      return this.studentsApi.approveStudent(rosterRowIds[0], 'active');
    }
    return this.studentsApi.approveStudentsBulk(rosterRowIds, 'active');
  }
}
