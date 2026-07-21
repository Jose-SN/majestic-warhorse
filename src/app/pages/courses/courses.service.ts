import { Injectable } from '@angular/core';
import { forkJoin, map, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CoursesApiService } from 'src/app/services/api-service/courses-api.service';
import { ICourseList } from './modal/course-list';
import { CourseDetailsService } from '../course-details/course-details.service';
import { CommonService } from 'src/app/shared/services/common.service';

@Injectable({
  providedIn: 'root',
})
export class CoursesService {
  private readonly baseParams = {
    populateChapters: true,
    populateFiles: true,
  } as const;

  constructor(
    private coursesApi: CoursesApiService,
    private courseDetailsService: CourseDetailsService,
    private commonService: CommonService
  ) {}

  getCourseList(): Observable<ICourseList[]> {
    const role = this.commonService.loginedUserInfo?.role || '';
    const loginType = sessionStorage.getItem('loginType') || '';
    const userId = this.commonService.loginedUserInfo?.id || '';
    const orgId = sessionStorage.getItem('organization_id') || '';
    const isOrganization =
      loginType === 'organization' || role === 'organization';

    if (isOrganization && orgId) {
      return this.getOrganizationCourseList(orgId);
    }

    if (role === 'teacher' && userId) {
      return this.getTeacherCourseList(userId, orgId);
    }

    if (role === 'student' && userId) {
      return this.getStudentCourseList(userId, orgId);
    }

    return this.coursesApi.getCourses({ ...this.baseParams }).pipe(
      map((courses) => this.enrichCourses(courses)),
      catchError(() => of([]))
    );
  }

  /**
   * Organization — 1 call:
   * GET /course/get?organization_id={orgId}
   * → all org courses (public + private), including teacher-created.
   */
  private getOrganizationCourseList(orgId: string): Observable<ICourseList[]> {
    return this.coursesApi
      .getCourses({ ...this.baseParams, organization_id: orgId })
      .pipe(
        map((courses) => this.enrichCourses(courses)),
        catchError(() => of([]))
      );
  }

  /**
   * Teacher — 1 call when org is known:
   * GET /course/get?organization_id={orgId}
   * Keep: access=public OR createdBy=me (public + private).
   * Unapproved: public courses only.
   * Fallback without org: createdBy=me only.
   */
  private getTeacherCourseList(userId: string, orgId: string): Observable<ICourseList[]> {
    const publicOnly = this.commonService.isAwaitingOrganizationApproval();

    if (!orgId) {
      return this.coursesApi
        .getCourses({ ...this.baseParams, createdBy: userId })
        .pipe(
          map((courses) =>
            this.enrichCourses(
              publicOnly ? courses.filter((course) => course.access !== 'private') : courses
            )
          ),
          catchError(() => of([]))
        );
    }

    return this.coursesApi
      .getCourses({ ...this.baseParams, organization_id: orgId })
      .pipe(
        map((courses) =>
          this.enrichCourses(
            courses.filter((course) => {
              if (publicOnly) {
                return course.access !== 'private';
              }
              return course.access !== 'private' || this.courseCreatorId(course) === userId;
            })
          )
        ),
        catchError(() => of([]))
      );
  }

  /**
   * Student — 2 calls:
   * 1) GET /course/student/:id?organization_id=  (assigned teachers, public + private)
   * 2) GET /course/get?organization_id={orgId}&access=public
   * Unapproved: public org courses only.
   */
  private getStudentCourseList(userId: string, orgId: string): Observable<ICourseList[]> {
    const publicOnly = this.commonService.isAwaitingOrganizationApproval();

    const orgPublic$ = orgId
      ? this.coursesApi
          .getCourses({
            ...this.baseParams,
            organization_id: orgId,
            access: 'public',
          })
          .pipe(catchError(() => of([] as ICourseList[])))
      : of([] as ICourseList[]);

    if (publicOnly) {
      return orgPublic$.pipe(map((courses) => this.enrichCourses(courses)));
    }

    const teacherCourses$ = this.coursesApi
      .getStudentCourses(userId, orgId)
      .pipe(catchError(() => of([] as ICourseList[])));

    return forkJoin({ teacherCourses: teacherCourses$, orgPublic: orgPublic$ }).pipe(
      map(({ teacherCourses, orgPublic }) =>
        this.enrichCourses(this.mergeCoursesById(teacherCourses, orgPublic))
      )
    );
  }

  async fetchCoursesForCurrentUser(): Promise<ICourseList[]> {
    return new Promise((resolve) => {
      this.getCourseList().subscribe({
        next: (courses) => resolve(courses),
        error: () => resolve([]),
      });
    });
  }

  private courseCreatorId(course: ICourseList): string {
    const createdBy = course?.createdBy as unknown;
    if (!createdBy) return '';
    if (typeof createdBy === 'string') return createdBy.trim();
    return String((createdBy as { id?: string }).id || '').trim();
  }

  private mergeCoursesById(...lists: ICourseList[][]): ICourseList[] {
    const byId = new Map<string, ICourseList>();
    lists.flat().forEach((course) => {
      if (!course?.id) return;
      if (!byId.has(course.id)) {
        byId.set(course.id, course);
      }
    });
    return Array.from(byId.values());
  }

  private enrichCourses(courseLists: ICourseList[]): ICourseList[] {
    if (!courseLists.length) {
      return [];
    }
    const userId = this.commonService.loginedUserInfo?.id;
    courseLists.forEach((course) => {
      let completedLessonCount = 0;
      const chapters = course.chapterDetails ?? [];
      chapters.forEach((chapterDetails, index) => {
        const chapterCompleted = chapterDetails.fileDetails?.every((fileDetails) => {
          return this.courseDetailsService.courseStatusList.find(
            (courseStatus) =>
              courseStatus.parentId === fileDetails.id &&
              +courseStatus.percentage === 100 &&
              (!userId || courseStatus.createdBy === userId)
          );
        });
        if (chapterCompleted) {
          completedLessonCount = (completedLessonCount || 0) + 1;
        }
        if (index + 1 === chapters.length) {
          course.chapterCompletedCount = completedLessonCount || 0;
          course.courseStatusLevel = this.courseDetailsService.resolveCourseStatusLevel(
            course,
            this.courseDetailsService.courseStatusList,
            userId
          );
          course.completionPercent = chapters.length
            ? `${Math.round((completedLessonCount / chapters.length) * 100)}%`
            : '0%';
        }
      });
    });
    return courseLists;
  }
}
