import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { CoursesApiService } from 'src/app/services/api-service/courses-api.service';
import { ICourseList } from './modal/course-list';

@Injectable({
  providedIn: 'root',
})
export class CoursesService {
  constructor(private coursesApi: CoursesApiService) {}

  getCourseList(): Observable<ICourseList[]> {
    return this.coursesApi.geAllDetailsCourseList().pipe(
      map((courseList: any) => {
        return courseList ?? [];
      })
    );
  }
}
