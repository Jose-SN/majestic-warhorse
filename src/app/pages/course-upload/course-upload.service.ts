import { Injectable } from '@angular/core';
import { IChapterInfo, ISaveCourse } from './model/chapter-info';
import { IFileObjectInfo } from './model/file-object-info';
import { IMainCourseInfo } from './model/course-info';
import { CommonService } from 'src/app/shared/services/common.service';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';

@Injectable({
  providedIn: 'root',
})
export class CourseUploadService {
  public FILE_OBJECT_INFO: IFileObjectInfo = {
    url: '',
    name: '',
    enableDelete: false,
    enablePreview: false,
    chapterDescription: '',
  };
  public MAIN_COURSE_INFO: IMainCourseInfo = {
    coverImage: '',
    courseTitle: '',
    courseDescription: '',
  };
  public CHAPTER_INFO: IChapterInfo = {
    attachments: [],
    chapterTitle: '',
    fileDetails: [this.FILE_OBJECT_INFO],
  };
  private MESSAGES: { [key: string]: string } = {
    coverImage: 'Please Upload Course Cover Image',
    courseTitle: 'Please Enter Course Title',
    courseDescription: 'Please Enter Course Description',
  };
  constructor(private commonService: CommonService) {}
  async saveCourseDetails(courseDetails: ISaveCourse) {
    const isValid = await this.courseSaveValidation(courseDetails);
    console.log('------------------>', isValid);
  }
  courseSaveValidation(courseDetails: ISaveCourse) {
    return new Promise((resolve) => {
      for (let objectKey in courseDetails.mainCourseInfo) {
        if (!courseDetails.mainCourseInfo[objectKey as keyof IMainCourseInfo]) {
          this.commonService.openToaster({
            message: this.MESSAGES[objectKey],
            messageType: TOASTER_MESSAGE_TYPE.ERROR,
          });
          resolve(false);
          return;
        }
      }
      for (let chapter of courseDetails.chapterInfo) {
        if (!chapter.chapterTitle) {
          this.commonService.openToaster({
            message: 'Please Enter Course Chapter Title',
            messageType: TOASTER_MESSAGE_TYPE.ERROR,
          });
          resolve(false);
          return;
        }
        for (let video of chapter.fileDetails) {
          if (!video.url) {
            this.commonService.openToaster({
              message: 'Please Upload Course Video',
              messageType: TOASTER_MESSAGE_TYPE.ERROR,
            });
            resolve(false);
            return;
          }
        }
      }
      resolve(true);
    });
  }
}
