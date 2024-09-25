export interface ICourseList {
  name: string;
  author: string;
  autorid: number;
  coursetitle: string;
  thumbnail: string;
}
export interface IcourseListResponse {
  success?: boolean;
  data: ICourseList;
}
