import { Injectable } from '@angular/core';
import { ISidepanel } from './modal/dashboard-modal';
import { Subject, catchError, lastValueFrom } from 'rxjs';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { ICourseList } from '../courses/modal/course-list';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AssignTeacherService } from 'src/app/components/assign-teachers/assign-teacher.service';
import { RosterDisplayService } from 'src/app/services/api-service/roster-display.service';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  public SIDE_PANEL_LIST: ISidepanel = {
    CPD: 'CPD',
    ACCOUNT: 'ACCOUNT',
    SETTINGS: 'SETTINGS',
    COURSE_LISTING: 'COURSE_LISTING',
    LEADERSHIP_BOARD: 'LEADERSHIP_BOARD',
    DASHBOARD_OVERVIEW: 'DASHBOARD_OVERVIEW',
    TEACHERS_LISTING: 'TEACHERS_LISTING',
    STUDENTS_LISTING: 'STUDENTS_LISTING',
    ASSIGN_TEACHER: 'ASSIGN_TEACHER',
    INVITE_TEACHER: 'INVITE_TEACHER',
    INVITE_STUDENT: 'INVITE_STUDENT',
    SWITCH_ORG: 'SWITCH_ORG',
    TEACHER_APPROVAL: 'TEACHER_APPROVAL',
    STUDENT_APPROVAL: 'STUDENT_APPROVAL',
    APPROVAL_PENDING: 'APPROVAL_PENDING',
    ASSESMENT:"ASSESMENT",
    AI_MODE: 'AI_MODE',
  };
  public courseDetailsInfo: Subject<{ [key: string]: boolean | ICourseList }> = new Subject();
  private _apiUrl: string = environment.majesticWarhorseApi;
  constructor(
    private authService: AuthService,
    private commonService: CommonService,
    private http: HttpClient,
    private assignTeacherService: AssignTeacherService,
    private rosterDisplay: RosterDisplayService
  ) {}
  async getAllUsers() {
    this.commonService.alluserList = await this.authService.getAllUsers();
  }
  setCourseDetailsInfo(courseInfo: { [key: string]: boolean | ICourseList }) {
    this.courseDetailsInfo.next(courseInfo);
  }
  getCourseDetailsInfo() {
    return this.courseDetailsInfo.asObservable();
  }
  async fetchUploadedCourseCount() {
    let role: string = this.commonService.loginedUserInfo?.role || '';
    
    // For organization, calculate stats from allUsersList and teacher-student relationships
    if (role === 'organization') {
      const orgId = sessionStorage.getItem('organization_id') || '';
      if (!orgId) {
        return { totalTeachers: 0, totalStudents: 0, unassignedStudents: 0, unassignedTeachers: 0 };
      }

      const [teachers, students, relationshipsResponse] = await Promise.all([
        this.rosterDisplay.loadTeachers(orgId, 'active'),
        this.rosterDisplay.loadStudents(orgId, 'active'),
        lastValueFrom(this.assignTeacherService.getAllTeacherStudentRelationships()).catch(() => ({ data: [] })),
      ]);

      const relationships = (relationshipsResponse as any)?.data ?? relationshipsResponse ?? [];
      const relList = Array.isArray(relationships) ? relationships : [];

      const assignedStudentIds = new Set<string>();
      const assignedTeacherIds = new Set<string>();

      relList.forEach((rel: any) => {
        const studentId = rel.student_id || rel.studentId;
        const teacherId = rel.teacher_id || rel.teacherId;
        if (studentId) assignedStudentIds.add(studentId);
        if (teacherId) assignedTeacherIds.add(teacherId);
      });

      const unassignedStudents = students.filter((s) => !assignedStudentIds.has(s.id || ''));
      const unassignedTeachers = teachers.filter((t) => !assignedTeacherIds.has(t.id || ''));

      return {
        totalTeachers: teachers.length,
        totalStudents: students.length,
        unassignedStudents: unassignedStudents.length,
        unassignedTeachers: unassignedTeachers.length,
      };
    }
    
    // For non-organization roles, call the API as before
    const roleInfo: { [key: string]: string } = {
      teacher: `isTeacher=true&id=${this.commonService.loginedUserInfo?.id}`,
      student: `isStudent=true&id=${this.commonService.loginedUserInfo?.id}`,
    };
    
    return lastValueFrom(
      this.http
        .get<any>(`${this._apiUrl}dashboard/get?${roleInfo[role]}`)
        .pipe(catchError(this.commonService.handleError))
    );
  }
}
