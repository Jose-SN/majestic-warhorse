import { Injectable } from '@angular/core';
import { map, Observable, Subject, takeUntil } from 'rxjs';
import { CoursesApiService } from 'src/app/services/api-service/courses-api.service';
import { ICourseList } from './modal/course-list';

@Injectable({
  providedIn: 'root',
})
export class CoursesService {
  constructor(private coursesApi: CoursesApiService) {}

  getCourseList(): Observable<ICourseList[]> {
    return this.coursesApi.getCourseList().pipe(
      map((courseList) => {
        let testData: any[] = [];
        testData = testData.concat(courseList.data);
        testData = testData.concat(courseList.data);
        testData = testData.concat(courseList.data);
        testData = testData.concat(courseList.data);
        testData = testData.concat(courseList.data);
        testData = testData.concat(courseList.data);
        testData = testData.concat(courseList.data);
        testData = testData.concat(courseList.data);
        testData = testData.concat(courseList.data);
        testData = testData.concat(courseList.data);
        testData = testData.concat(courseList.data);
        return testData;
      })
    );
  }
}
