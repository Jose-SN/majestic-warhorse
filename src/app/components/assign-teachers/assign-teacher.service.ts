import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError } from 'rxjs';
import { CommonService } from 'src/app/shared/services/common.service';
import { environment } from 'src/environments/environment';

export interface StudentAssignment {
  teacher_id: string;
  student_ids: string[];
  unassign_student_ids?: string[];
}

export interface TeacherAssignment {
  student_id: string;
  teacher_ids: string[];
}

@Injectable({
  providedIn: 'root',
})
export class AssignTeacherService {
  private _apiUrl: string = environment.majesticWarhorseApi;

  constructor(
    private http: HttpClient,
    private commonService: CommonService
  ) {}

  private getAssignmentContext() {
    return {
      organization_id:
        sessionStorage.getItem('organization_id') ||
        this.commonService.loginedUserInfo?.organization_id ||
        '',
      assigned_by: this.commonService.loginedUserInfo?.id || '',
    };
  }

  public assignTeachersToStudent(assignments: TeacherAssignment[]) {
    const ctx = this.getAssignmentContext();
    return this.http
      .post<any>(`${this._apiUrl}teacher-students/assign-teachers`, {
        organization_id: ctx.organization_id,
        assigned_by: ctx.assigned_by,
        assignments,
      })
      .pipe(catchError(this.commonService.handleError));
  }

  public unassignTeachersFromStudent(payload: {
    student_id: string;
    unassign_teacher_ids: string[];
  }) {
    const orgId = this.getAssignmentContext().organization_id;
    return this.http
      .post<any>(`${this._apiUrl}teacher-students/unassign-teachers`, {
        ...payload,
        organization_id: orgId,
      })
      .pipe(catchError(this.commonService.handleError));
  }

  public getAssignedTeachers(studentId: string, organizationId?: string) {
    const orgId = organizationId || sessionStorage.getItem('organization_id') || '';
    const query = orgId ? `?organization_id=${encodeURIComponent(orgId)}` : '';
    return this.http
      .get<any>(`${this._apiUrl}teacher-students/student/${studentId}/teachers${query}`)
      .pipe(catchError(this.commonService.handleError));
  }

  public getAssignedStudents(teacherId: string, organizationId?: string) {
    const orgId = organizationId || sessionStorage.getItem('organization_id') || '';
    const query = orgId ? `?organization_id=${encodeURIComponent(orgId)}` : '';
    return this.http
      .get<any>(`${this._apiUrl}teacher-students/teacher/${teacherId}/students${query}`)
      .pipe(catchError(this.commonService.handleError));
  }

  public assignStudentsToTeacher(assignments: StudentAssignment[]) {
    const ctx = this.getAssignmentContext();
    return this.http
      .post<any>(`${this._apiUrl}teacher-students/assign-students`, {
        organization_id: ctx.organization_id,
        assigned_by: ctx.assigned_by,
        assignments: assignments.map(({ teacher_id, student_ids }) => ({
          teacher_id,
          student_ids,
        })),
      })
      .pipe(catchError(this.commonService.handleError));
  }

  public unassignStudentsFromTeacher(payload: {
    teacher_id: string;
    unassign_student_ids: string[];
  }) {
    const orgId = this.getAssignmentContext().organization_id;
    return this.http
      .post<any>(`${this._apiUrl}teacher-students/unassign-students`, {
        ...payload,
        organization_id: orgId,
      })
      .pipe(catchError(this.commonService.handleError));
  }

  public getAllTeacherStudentRelationships() {
    return this.http
      .get<any>(`${this._apiUrl}teacher-students/get`)
      .pipe(catchError(this.commonService.handleError));
  }
}
