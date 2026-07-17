import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { CoursesApiService } from 'src/app/services/api-service/courses-api.service';
import { ICourseList } from './modal/course-list';
import { CourseDetailsService } from '../course-details/course-details.service';
import { CommonService } from 'src/app/shared/services/common.service';

@Injectable({
  providedIn: 'root',
})
export class CoursesService {
  constructor(
    private coursesApi: CoursesApiService,
    private courseDetailsService: CourseDetailsService,
    private commonService: CommonService
  ) {}

  getCourseList(): Observable<ICourseList[]> {
    const role = this.commonService.loginedUserInfo?.role || '';
    const userId = this.commonService.loginedUserInfo?.id || '';
    const orgId = sessionStorage.getItem('organization_id') || '';

    if (role === 'student' && userId) {
      return this.coursesApi.getStudentCourses(userId, orgId).pipe(
        map((courses) => this.enrichCourses(courses))
      );
    }

    const params: { populateChapters?: boolean; populateFiles?: boolean; createdBy?: string; organization_id?: string } = {
      populateChapters: true,
      populateFiles: true,
    };
    if (orgId) {
      params.organization_id = orgId;
    }
    if (role === 'teacher' && userId) {
      params.createdBy = userId;
    }

    return this.coursesApi.getCourses(params).pipe(
      map((courses) => {
        let filtered = courses;
        if (role === 'teacher' && userId) {
          filtered = courses.filter((course) => this.courseCreatedByUser(course, userId));
        }
        if (orgId) {
          filtered = filtered.filter(
            (course) => !course.organization_id || course.organization_id === orgId
          );
        }
        return this.enrichCourses(filtered);
      })
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

  private courseCreatedByUser(course: ICourseList, userId: string): boolean {
    const createdBy = course.createdBy as { id?: string } | string | undefined;
    if (typeof createdBy === 'string') {
      return createdBy === userId;
    }
    return (createdBy?.id ?? '') === userId;
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
