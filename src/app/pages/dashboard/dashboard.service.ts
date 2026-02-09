import { Injectable } from '@angular/core';
import { ISidepanel } from './modal/dashboard-modal';
import { BehaviorSubject, catchError, lastValueFrom, Observable, Subject } from 'rxjs';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { ICourseList } from '../courses/modal/course-list';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AssignTeacherService } from 'src/app/components/assign-teachers/assign-teacher.service';

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
    TEACHER_APPROVAL: 'TEACHER_APPROVAL',
    APPROVAL_PENDING: 'APPROVAL_PENDING',
    ASSESMENT:"ASSESMENT"
  };
  public sidePanelChange$: BehaviorSubject<string> = new BehaviorSubject(
    this.SIDE_PANEL_LIST.DASHBOARD_OVERVIEW
  );
  public courseDetailsInfo: Subject<{ [key: string]: boolean | ICourseList }> = new Subject();
  private _apiUrl: string = environment.majesticWarhorseApi;
  constructor(
    private authService: AuthService,
    private commonService: CommonService,
    private http: HttpClient,
    private assignTeacherService: AssignTeacherService
  ) {}
  async getAllUsers() {
    this.commonService.alluserList = await this.authService.getAllUsers();
  }
  setSidePanelChangeValue(changedpanel: string) {
    this.sidePanelChange$.next(changedpanel);
  }
  getSidePanelChange(): Observable<string> {
    return this.sidePanelChange$.asObservable();
  }
  setCourseDetailsInfo(courseInfo: { [key: string]: boolean | ICourseList }) {
    this.courseDetailsInfo.next(courseInfo);
  }
  getCourseDetailsInfo() {
    return this.courseDetailsInfo.asObservable();
  }
  async fetchUploadedCourseCount() {
    let role: string = this.commonService.loginedUserInfo.role ?? '';
    
    // For admin, calculate stats from allUsersList and teacher-student relationships
    if (role === 'admin') {
      const allUsers = this.commonService.allUsersList || [];
      
      // Filter users by role
      const teachers = allUsers.filter(user => user.role === 'teacher');
      const students = allUsers.filter(user => user.role === 'student');
      
      // Fetch all teacher-student relationships from the new API
      let relationships: any[] = [];
      try {
        const relationshipsResponse = await lastValueFrom(
          this.assignTeacherService.getAllTeacherStudentRelationships()
        );
        relationships = relationshipsResponse.data || relationshipsResponse || [];
      } catch (error) {
        console.error('Error fetching teacher-student relationships:', error);
        // Continue with empty relationships array if API fails
      }
      
      // Create sets of assigned student IDs and teacher IDs from relationships
      const assignedStudentIds = new Set<string>();
      const assignedTeacherIds = new Set<string>();
      
      relationships.forEach((rel: any) => {
        const studentId = rel.student_id || rel.studentId;
        const teacherId = rel.teacher_id || rel.teacherId;
        if (studentId) assignedStudentIds.add(studentId);
        if (teacherId) assignedTeacherIds.add(teacherId);
      });
      
      // Count unassigned students (students not in any relationship)
      const unassignedStudents = students.filter(student => 
        !assignedStudentIds.has(student.id || '')
      );
      
      // Count unassigned teachers (teachers not in any relationship)
      const unassignedTeachers = teachers.filter(teacher => 
        !assignedTeacherIds.has(teacher.id || '')
      );
      
      return {
        totalTeachers: teachers.length,
        totalStudents: students.length,
        unassignedStudents: unassignedStudents.length,
        unassignedTeachers: unassignedTeachers.length,
      };
    }
    
    // For non-admin roles, call the API as before
    const roleInfo: { [key: string]: string } = {
      teacher: 'isTeacher=true',
      student: 'isStudent=true',
    };
    
    return lastValueFrom(
      this.http
        .get<any>(`${this._apiUrl}dashboard/get?${roleInfo[role]}`)
        .pipe(catchError(this.commonService.handleError))
    );
  }
}
