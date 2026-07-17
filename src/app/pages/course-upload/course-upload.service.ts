import { Injectable } from '@angular/core';
import { IChapterInfo, ISaveCourse } from './model/chapter-info';
import { IFileObjectInfo } from './model/file-object-info';
import { IMainCourseInfo } from './model/course-info';
import { CommonService } from 'src/app/shared/services/common.service';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';
import { Subject, takeUntil, firstValueFrom } from 'rxjs';
import { CommonApiService } from 'src/app/shared/api-service/common-api.service';
import { CoursesApiService } from 'src/app/services/api-service/courses-api.service';
import { HttpEventType } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class CourseUploadService {
  public FILE_OBJECT_INFO: IFileObjectInfo = {
    fileURL: '',
    name: '',
    description: '',
  };
  public MAIN_COURSE_INFO: IMainCourseInfo = {
    courseCoverImage: '',
    courseTitle: '',
    courseDescription: '',
  };
  public CHAPTER_INFO: IChapterInfo = {
    attachments: [],
    chapterTitle: '',
    chapterDescription: '',
    fileDetails: [],
  };
  private MESSAGES: { [key: string]: string } = {
    courseCoverImage: 'Please Upload Course Cover Image',
    courseTitle: 'Please Enter Course Title',
    courseDescription: 'Please Enter Course Description',
  };
  public MAX_FILE_SIZE: number = 5 * 1024 * 1024; // 5 MB
  public ALLOWED_FILE_TYPES: string[] = ['image/png', 'image/jpeg', 'image/jpg'];
  private ALLOWED_DOCUMENT_TYPES: string[] = [
    'application/pdf', // PDF
    'application/msword', // DOC
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'application/vnd.ms-excel', // XLS
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
    'application/vnd.ms-powerpoint', // PPT
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
    'text/plain', // TXT
  ];
  private ALLOWED_VIDEO_TYPES: string[] = [
    'video/mp4', // MP4
    'video/webm', // WebM
    'video/ogg', // Ogg
    'video/avi', // AVI
    'video/mov', // MOV
    'video/wmv', // WMV
    'video/mkv', // MKV
    'video/x-matroska', // Alternative MKV MIME type
  ];
  private readonly UPLOAD_BUCKET_BY_TYPE: Record<string, string> = {
    COURSE: 'course',
    CHAPTER: 'chapter',
    ATTACHMENT: 'attachment',
    VIDEO_FILE: 'video-file',
    COVER_IMAGE: 'cover-image',
  };
  constructor(
    private commonService: CommonService,
    private courseApi: CoursesApiService,
    private commonApiService: CommonApiService
  ) {}
  async saveCourseDetails(
    courseDetails: ISaveCourse,
    _destroy$: Subject<void>
  ): Promise<boolean | any> {
    const isValid = await this.courseSaveValidation(courseDetails);
    if (isValid) {
      courseDetails.chapterInfo.forEach((chapterInfo) => {
        chapterInfo.createdBy = this.commonService.loginedUserInfo.id;
      });
      let courseSaveApi: any;
      if (courseDetails.mainCourseInfo.id) {
        courseSaveApi = this.courseApi.updateCourseDetails.bind(this.courseApi);
      } else {
        courseSaveApi = this.courseApi.saveCourseDetails.bind(this.courseApi);
      }
      return new Promise((resolve) => {
        courseSaveApi({
          ...courseDetails.mainCourseInfo,
          ...{
            chapterDetails: courseDetails.chapterInfo,
            createdBy: this.commonService.loginedUserInfo.id,
            organization_id:
              sessionStorage.getItem('organization_id') ||
              this.commonService.loginedUserInfo.organization_id ||
              '',
          },
        })
          .pipe(takeUntil(_destroy$))
          .subscribe({
            next: (courseSave: { success: any }) => {
              if (courseSave.success) {
                this.commonService.openToaster({
                  message: 'Course Uploaded succesfully',
                  messageType: TOASTER_MESSAGE_TYPE.SUCCESS,
                });
                resolve(true);
              } else {
                this.commonService.openToaster({
                  message: 'Error while uploading the course',
                  messageType: TOASTER_MESSAGE_TYPE.ERROR,
                });
              }
            },
            error: () => {
              this.commonService.openToaster({
                message: 'Error while uploading the course',
                messageType: TOASTER_MESSAGE_TYPE.ERROR,
              });
            },
          });
      });
    }
  }
  public onFileUpload(
    _destroy$: Subject<void>,
    selectedFile: File,
    uploadType: string,
    progressBarInfo: any = {}
  ): Promise<string> {
    return new Promise(async (resolve) => {
      if (await this.onFileUploadValidation(selectedFile, uploadType)) {
        const formData: FormData = new FormData();
        formData.append('bucket_name', this.resolveBucketName(uploadType));
        formData.append('file', selectedFile);
        this.commonApiService
          .uploadImage(formData)
          .pipe(takeUntil(_destroy$))
          .subscribe({
            next: (event: any) => {
              if (event.type === HttpEventType.UploadProgress && event.total) {
                progressBarInfo.completedPercentage = Math.round(
                  (100 * event.loaded) / event.total
                );
              } else if (event.type === HttpEventType.Response) {
                resolve(event?.body?.['url']);
              }
            },
            error: () => {
              this.commonService.openToaster({
                message: 'Error while uploading file, please re-upload',
                messageType: TOASTER_MESSAGE_TYPE.ERROR,
              });
              resolve('');
            },
          });
      }
    });
  }

  private resolveBucketName(uploadType: string): string {
    return this.UPLOAD_BUCKET_BY_TYPE[uploadType] || 'course';
  }

  onFileUploadValidation(selectedFile: File, uploadType: string): Promise<boolean> {
    return new Promise((resolve) => {
      switch (uploadType) {
        case 'COVER_IMAGE':
          if (!this.ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
            this.commonService.openToaster({
              message: 'Only PNG and JPEG files are allowed!',
              messageType: TOASTER_MESSAGE_TYPE.ERROR,
            });
            resolve(false);
            return;
          }
          if (selectedFile.size > this.MAX_FILE_SIZE) {
            this.commonService.openToaster({
              message: 'File size should not exceed 5MB!',
              messageType: TOASTER_MESSAGE_TYPE.ERROR,
            });
            resolve(false);
            return;
          }
          break;
        case 'ATTACHMENT':
          if (!this.ALLOWED_DOCUMENT_TYPES.includes(selectedFile.type)) {
            this.commonService.openToaster({
              message: 'Selected file  is not a supported document type',
              messageType: TOASTER_MESSAGE_TYPE.ERROR,
            });
            resolve(false);
            return;
          }
          break;
        case 'VIDEO_FILE':
          if (!this.ALLOWED_VIDEO_TYPES.includes(selectedFile.type)) {
            this.commonService.openToaster({
              message: 'Selected file is not a supported video type.',
              messageType: TOASTER_MESSAGE_TYPE.ERROR,
            });
            resolve(false);
            return;
          }
          break;
      }
      resolve(true);
    });
  }

  validateChapterVideosBeforeAdd(chapter: IChapterInfo): boolean {
    if (!chapter.chapterTitle?.trim()) {
      this.commonService.openToaster({
        message: 'Please enter the chapter title before adding another video.',
        messageType: TOASTER_MESSAGE_TYPE.ERROR,
      });
      return false;
    }

    for (let index = 0; index < chapter.fileDetails.length; index++) {
      const video = chapter.fileDetails[index];
      const videoLabel = (index + 1).toString().padStart(2, '0');

      if (!video.fileURL?.trim()) {
        this.commonService.openToaster({
          message: `Please add a video URL or upload for video ${videoLabel} before adding another.`,
          messageType: TOASTER_MESSAGE_TYPE.ERROR,
        });
        return false;
      }

      if (!video.description?.trim()) {
        this.commonService.openToaster({
          message: `Please enter a description for video ${videoLabel} before adding another.`,
          messageType: TOASTER_MESSAGE_TYPE.ERROR,
        });
        return false;
      }
    }

    return true;
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
          if (!video.fileURL) {
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
  async fetchUploadedCourses() {
    const role = this.commonService.loginedUserInfo?.role || '';
    const userId = this.commonService.loginedUserInfo?.id || '';
    const orgId = sessionStorage.getItem('organization_id') || '';

    if (role === 'student' && userId) {
      const courses = await firstValueFrom(this.courseApi.getStudentCourses(userId, orgId)).catch(
        () => [] as any[]
      );
      return courses;
    }

    const params: { createdBy?: string; organization_id?: string } = {};
    if (orgId) params.organization_id = orgId;
    if (role === 'teacher' && userId) params.createdBy = userId;

    const courses = await this.courseApi.fetchUploadedCourses(params);
    if (role === 'teacher' && userId) {
      return courses.filter((course: any) => {
        const createdBy = course.createdBy?.id ?? course.createdBy;
        return createdBy === userId;
      });
    }
    if (orgId) {
      return courses.filter(
        (course: any) => !course.organization_id || course.organization_id === orgId
      );
    }
    return courses;
  }
}
