export interface ICourseStatus {
  _id?: string;
  parentId: string;
  parentType: string;
  rating: number;
  createdBy: string;
  creation_date?: string;
  modification_date?: string;
}
