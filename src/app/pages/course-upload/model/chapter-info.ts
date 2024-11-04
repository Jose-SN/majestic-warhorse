import { IMainCourseInfo } from './course-info';
import { IFileObjectInfo } from './file-object-info';

export interface IChapterInfo {
  chapterTitle: string;
  attachments: string[];
  fileDetails: IFileObjectInfo[];
}
export interface ISaveCourse {
  mainCourseInfo: IMainCourseInfo;
  chapterInfo: IChapterInfo[];
}
