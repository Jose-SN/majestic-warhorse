export interface ICourseStatus {
  id?: string;
  parentId: string;
  parentType: string;
  rating: number;
  createdBy: string;
  percentage: number;
  creation_date?: string;
  modification_date?: string;
}
