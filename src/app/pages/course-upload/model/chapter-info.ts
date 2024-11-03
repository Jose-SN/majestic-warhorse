import { IFileObjectInfo } from './file-object-info';

export interface IChapterInfo {
  chapterTitle: string;
  attachments: string[];
  fileDetails: IFileObjectInfo[];
}
