import { Injectable } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { CoursesApiService } from 'src/app/services/api-service/courses-api.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';
import { ICourseStatus } from './model/course-status';

@Injectable({
  providedIn: 'root',
})
export class CourseDetailsService {
  public courseStatusList: ICourseStatus[] = [];
  public reconfigureStatus$: Subject<any> = new Subject<true>();
  constructor(
    private commonService: CommonService,
    private courseApiService: CoursesApiService
  ) {}
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const hoursPart = hours > 0 ? `${hours} hour${hours !== 1 ? 's' : ''}` : '';
    const minutesPart = minutes > 0 ? `${minutes} minute${minutes !== 1 ? 's' : ''}` : '';
    const secondsPart =
      remainingSeconds > 0 ? `${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}` : '';
    return [hoursPart, minutesPart, secondsPart].filter(Boolean).join(' ').trim();
  }
  saveCourseRating(saveInfo: any, destroy$: Subject<void>) {
    const createdId = this.commonService.loginedUserInfo.id;
    let service;
    let statusPayload;
    if (saveInfo.isVideo) {
      statusPayload = {
        rating: null,
        createdBy: createdId,
        parentId: saveInfo.activeFile._id,
        parentType: 'File',
        percentage:
          saveInfo.courseStatusInfo.percentage !== 100 ? saveInfo.videoPercentage || 0 : 100,
        ...(saveInfo.videoStatusInfo._id && { _id: saveInfo.videoStatusInfo._id }),
      };
    } else {
      statusPayload = {
        percentage: null,
        createdBy: createdId,
        parentType: 'Chapter',
        rating: saveInfo.rating,
        parentId: saveInfo.activeChapter._id,
        ...(saveInfo.courseStatusInfo._id && { _id: saveInfo.courseStatusInfo._id }),
      };
    }
    if (statusPayload._id) {
      service = this.courseApiService.updateCourseStatus.bind(this.courseApiService);
    } else {
      service = this.courseApiService.saveCourseStatus.bind(this.courseApiService);
    }
   return new Promise((resolve) => {
      service(statusPayload)
      .pipe(takeUntil(destroy$))
      .subscribe({
        next: (success) => {
          resolve(success)
          if (!saveInfo.isVideo) {
            this.commonService.openToaster({
              message: 'Succesfully updated the status of the Course',
              messageType: TOASTER_MESSAGE_TYPE.SUCCESS,
            });
          }
          this.getCourseStatusList();
        },
        error: (error) => {
          resolve(error)
          this.commonService.openToaster({
            message: 'Error while updating the status of the course',
            messageType: TOASTER_MESSAGE_TYPE.ERROR,
          });
        },
      });
    })
  }
  async getCourseStatusList() {
    this.courseStatusList = await this.courseApiService.getCourseStatusList();
    this.reconfigureStatus$.next(true);
  }
  getReconfigurationHandler() {
    return this.reconfigureStatus$.asObservable();
  }
}
