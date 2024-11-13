export interface ICourseList {
  _id: string;
  courseCoverImage: string;
  courseTitle: string;
  courseDescription: string;
  chapters: string[];
  createdBy: CreatedBy;
  creation_date: Date;
  modification_date: Date;
  chapterDetails: ChapterDetail[];
}

export interface ChapterDetail {
  _id: string;
  attachments: string[];
  chapterTitle: string;
  files: string[];
  createdBy?: CreatedBy;
  creation_date: Date;
  modification_date: Date;
  fileDetails: FileDetail[];
}

export interface CreatedBy {
  _id: string;
  email: string;
  phone: string;
  role: string;
  firstName: string;
  lastName: string;
  profileImage:string;
}

export interface FileDetail {
  _id: string;
  parentId: string;
  parentType: string;
  description: string;
  fileURL: string;
  createdBy: CreatedBy;
  creation_date: Date;
  modification_date: Date;
}

export interface IcourseListResponse {
  success?: boolean;
  data: ICourseList;
}
