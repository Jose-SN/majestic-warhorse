import { IAttachmentObjectInfo } from "../../course-upload/model/file-object-info";

export interface ICourseList {
  chapterCompletedCount: number;
  id: string;
  courseCoverImage: string;
  courseTitle: string;
  courseDescription: string;
  chapters: string[];
  createdBy: CreatedBy;
  creation_date: Date;
  averageRating?:number;
  modification_date: Date;
  courseStatusLevel?:string;
  completionPercent?: string;
  chapterDetails: ChapterDetail[];
}

export interface ChapterDetail {
  id: string;
  attachments: IAttachmentObjectInfo[];
  chapterTitle: string;
  files: string[];
  createdBy?: CreatedBy;
  creation_date: Date;
  modification_date: Date;
  fileDetails: FileDetail[];
  completedCount: number;
}

export interface CreatedBy {
  id: string;
  first_name: string;
  last_name?: string;
  profile_image?: string;
  contact?: {
    email: string;
    phone?: string;
    [key: string]: any;
  };
  role?: string;
  // Legacy fields for backward compatibility
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
}

export interface FileDetail {
  id: string;
  parentId: string;
  parentType: string;
  description: string;
  fileURL: string;
  name?:string;
  createdBy: CreatedBy;
  creation_date: Date;
  modification_date: Date;
  videoDuration?:string;
}

export interface IcourseListResponse {
  success?: boolean;
  data: ICourseList;
}
