import { Injectable } from '@angular/core';
import { IChapterInfo } from './model/chapter-info';
import { IFileObjectInfo } from './model/file-object-info';
import { IMainCourseInfo } from './model/course-info';

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
    courseCoverImage: '',
    courseTitle: '',
    courseDescription: '',
  };
  public CHAPTER_INFO: IChapterInfo = {
    attachments: [],
    chapterTitle: '',
    fileDetails: [this.FILE_OBJECT_INFO],
  };
  constructor() {}
}
