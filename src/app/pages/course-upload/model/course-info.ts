export interface IMainCourseInfo {
  id?: string;
  courseCoverImage: string;
  courseTitle: string;
  courseDescription: string;
  /** Course visibility: public (org catalog) or private */
  access: 'public' | 'private';
}
