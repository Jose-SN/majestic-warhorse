import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { CoursesApiService } from 'src/app/services/api-service/courses-api.service';
import { ICourseList } from './modal/course-list';
import { CourseDetailsService } from '../course-details/course-details.service';

@Injectable({
  providedIn: 'root',
})
export class CoursesService {
  constructor(
    private coursesApi: CoursesApiService,
    private courseDetailsService: CourseDetailsService
  ) {}

  getCourseList(): Observable<ICourseList[]> {
    return this.coursesApi.geAllDetailsCourseList().pipe(
      map((courseLists: ICourseList[]) => {
        if (courseLists.length) {
          courseLists.forEach((course) => {
            let completedLessonCount = 0;
            course.chapterDetails.forEach((chapterDetails, index) => {
              const chapterCompleted = chapterDetails.fileDetails.every((fileDetails) => {
                return this.courseDetailsService.courseStatusList.find(
                  (courseStatus) =>
                    courseStatus.parentId === fileDetails.id && +courseStatus.percentage === 100
                );
              });
              if (chapterCompleted) {
                completedLessonCount = (completedLessonCount || 0) + 1;
              }
              if (index + 1 === course.chapterDetails.length) {
                course.chapterCompletedCount = completedLessonCount || 0;
                if (!completedLessonCount) {
                  course.courseStatusLevel = 'New';
                } else if (completedLessonCount === course.chapterDetails.length) {
                  course.courseStatusLevel = 'Completed';
                } else {
                  course.courseStatusLevel = 'Pending';
                }
                course.completionPercent =  `${(completedLessonCount/course.chapterDetails.length)*100}%`
              }
            });
          });
        }
        return courseLists ?? [];
      })
    );
  }
}
