import { IMainCourseInfo } from './course-info';
import { IAttachmentObjectInfo, IFileObjectInfo } from './file-object-info';

export interface IChapterInfo {
  createdBy?: string;
  chapterTitle: string;
  attachments: IAttachmentObjectInfo[];
  fileDetails: IFileObjectInfo[];
}
export interface ISaveCourse {
  mainCourseInfo: IMainCourseInfo;
  chapterInfo: IChapterInfo[];
}
