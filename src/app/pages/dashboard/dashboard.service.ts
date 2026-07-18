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
import { isActiveStatus } from 'src/app/models/user-status.model';

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
    
    // For organization, calculate stats from roster joins and teacher-student relationships
    if (role === 'organization') {
      const orgId = sessionStorage.getItem('organization_id') || '';
      if (!orgId) {
        return {
          totalTeachers: 0,
          totalStudents: 0,
          unassignedStudents: 0,
          unassignedTeachers: 0,
          joinsByDate: Array(9).fill(0),
          newStudentSubscriptions: 0,
          todayJoins: 0,
        };
      }

      const [teachers, allStudents, relationshipsResponse] = await Promise.all([
        this.rosterDisplay.loadTeachers(orgId, 'active'),
        // Empty status loads full org roster so join dates include pending + active
        this.rosterDisplay.loadStudents(orgId, ''),
        lastValueFrom(this.assignTeacherService.getAllTeacherStudentRelationships()).catch(() => ({ data: [] })),
      ]);

      const students = allStudents.filter((student) => isActiveStatus(student.status));

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
      const joinsByDate = this.buildJoinsByDate(allStudents, 9);
      const newStudentSubscriptions = this.countJoinedWithinDays(allStudents, 7);
      const todayJoins = joinsByDate[joinsByDate.length - 1] ?? 0;

      return {
        totalTeachers: teachers.length,
        totalStudents: students.length,
        unassignedStudents: unassignedStudents.length,
        unassignedTeachers: unassignedTeachers.length,
        joinsByDate,
        newStudentSubscriptions,
        todayJoins,
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

  /** Join counts for the last `dayCount` calendar days (oldest → newest). */
  private buildJoinsByDate(
    users: Array<{ created_at?: string }>,
    dayCount = 9
  ): number[] {
    const counts = Array.from({ length: dayCount }, () => 0);
    const today = this.startOfLocalDay(new Date());

    users.forEach((user) => {
      if (!user.created_at) {
        return;
      }
      const joined = this.startOfLocalDay(new Date(user.created_at));
      if (Number.isNaN(joined.getTime())) {
        return;
      }
      const diffDays = Math.round((today.getTime() - joined.getTime()) / 86_400_000);
      if (diffDays >= 0 && diffDays < dayCount) {
        counts[dayCount - 1 - diffDays] += 1;
      }
    });

    return counts;
  }

  private countJoinedWithinDays(
    users: Array<{ created_at?: string }>,
    days: number
  ): number {
    const cutoff = this.startOfLocalDay(new Date());
    cutoff.setDate(cutoff.getDate() - (days - 1));

    return users.filter((user) => {
      if (!user.created_at) {
        return false;
      }
      const joined = new Date(user.created_at);
      return !Number.isNaN(joined.getTime()) && joined >= cutoff;
    }).length;
  }

  private startOfLocalDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
}
