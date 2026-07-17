import { Injectable } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import {
  CourseStatusListParams,
  CoursesApiService,
} from 'src/app/services/api-service/courses-api.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';
import { ICourseStatus } from './model/course-status';

export type CourseStatusLabel = 'New' | 'Progress' | 'Completed';

interface CourseStatusSource {
  chapterDetails?: Array<{
    fileDetails?: Array<{ id: string }>;
  }>;
}

@Injectable({
  providedIn: 'root',
})
export class CourseDetailsService {
  public courseStatusList: ICourseStatus[] = [];
  public reconfigureStatus$: Subject<any> = new Subject<true>();
  private lastStatusQuery: CourseStatusListParams = {};
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
  saveCourseLevelRating(
    saveInfo: {
      rating: number;
      courseId: string;
      courseRatingStatusInfo: ICourseStatus;
    },
    destroy$: Subject<void>
  ) {
    const createdId = this.commonService.loginedUserInfo.id;
    const rating = Math.round(saveInfo.rating * 100) / 100;
    const statusPayload = {
      percentage: null,
      createdBy: createdId,
      parentType: 'Course',
      rating,
      parentId: saveInfo.courseId,
      ...(saveInfo.courseRatingStatusInfo.id && { id: saveInfo.courseRatingStatusInfo.id }),
    };

    const service = statusPayload.id
      ? this.courseApiService.updateCourseStatus.bind(this.courseApiService)
      : this.courseApiService.saveCourseStatus.bind(this.courseApiService);

    return new Promise((resolve) => {
      service(statusPayload)
        .pipe(takeUntil(destroy$))
        .subscribe({
          next: (success) => {
            resolve(success);
            this.commonService.openToaster({
              message: 'Course rating saved',
              messageType: TOASTER_MESSAGE_TYPE.SUCCESS,
            });
            void this.getCourseStatusList();
          },
          error: (error) => {
            resolve(error);
            this.commonService.openToaster({
              message: 'Error while saving course rating',
              messageType: TOASTER_MESSAGE_TYPE.ERROR,
            });
          },
        });
    });
  }

  saveCourseRating(saveInfo: any, destroy$: Subject<void>) {
    const createdId = this.commonService.loginedUserInfo.id;
    let service;
    let statusPayload;
    if (saveInfo.isVideo) {
      const incoming = Math.min(100, Math.max(0, saveInfo.videoPercentage || 0));
      const existingStatus =
        saveInfo.videoStatusInfo?.parentId === saveInfo.activeFile?.id
          ? saveInfo.videoStatusInfo
          : null;
      const existingPercentage = existingStatus?.percentage ?? 0;
      const rawPercentage = Math.round(Math.max(existingPercentage, incoming) * 100) / 100;
      const useExistingId = Boolean(existingStatus?.id);

      statusPayload = {
        rating: null,
        createdBy: createdId,
        parentId: saveInfo.activeFile.id,
        parentType: 'File',
        percentage: rawPercentage,
        ...(useExistingId && { id: existingStatus!.id }),
      };
    } else {
      const rating =
        saveInfo.rating != null ? Math.round(saveInfo.rating * 100) / 100 : null;
      statusPayload = {
        percentage: null,
        createdBy: createdId,
        parentType: 'Chapter',
        rating,
        parentId: saveInfo.activeChapter.id,
        ...(saveInfo.courseStatusInfo.id && { id: saveInfo.courseStatusInfo.id }),
      };
    }
    if (statusPayload.id) {
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
          void this.getCourseStatusList();
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
  async getCourseStatusList(params?: CourseStatusListParams) {
    if (params) {
      this.lastStatusQuery = params;
    }
    this.courseStatusList = await this.courseApiService.getCourseStatusList(this.lastStatusQuery);
    this.reconfigureStatus$.next(true);
  }

  getOrganizationStatusQuery(): CourseStatusListParams {
    const organizationId =
      sessionStorage.getItem('organization_id') ||
      this.commonService.loginedUserInfo?.organization_id ||
      '';
    return organizationId ? { organization_id: organizationId } : {};
  }

  resolveCourseStatusLevel(
    course: CourseStatusSource,
    statusList: ICourseStatus[] = this.courseStatusList,
    userId?: string
  ): CourseStatusLabel {
    const chapters = course.chapterDetails ?? [];
    if (!chapters.length) {
      return 'New';
    }

    const resolvedUserId = userId || this.commonService.loginedUserInfo?.id;
    let completedChapterCount = 0;

    chapters.forEach((chapter) => {
      const files = chapter.fileDetails ?? [];
      if (!files.length) {
        return;
      }

      const chapterCompleted = files.every((file) =>
        statusList.some(
          (status) =>
            status.parentId === file.id &&
            +status.percentage === 100 &&
            (!resolvedUserId || status.createdBy === resolvedUserId)
        )
      );

      if (chapterCompleted) {
        completedChapterCount++;
      }
    });

    if (!completedChapterCount) {
      return 'New';
    }
    if (completedChapterCount === chapters.length) {
      return 'Completed';
    }
    return 'Progress';
  }

  getReconfigurationHandler() {
    return this.reconfigureStatus$.asObservable();
  }
}
