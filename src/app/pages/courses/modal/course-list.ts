export interface ICourseList {
  name: string;
  author: string;
  autorid: number;
  courseType: string;
  coursetitle: string;
  courseThumbnail: string;
}
export interface IcourseListResponse {
  success?: boolean;
  data: ICourseList;
}
