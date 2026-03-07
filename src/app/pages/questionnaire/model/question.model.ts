/** Matches PostgreSQL question table structure */
export interface IQuestion {
  id?: string;
  course_id: string;
  question?: string;
  type?: string;
  options?: IQuestionOption[];
  created_by: string;
  creation_date?: string;
  modification_date?: string;
}

export interface IQuestionOption {
  label: string;
  value: string;
}

/** Payload for creating a new question */
export interface IQuestionCreate {
  course_id: string;
  question?: string;
  type?: string;
  options?: IQuestionOption[];
  created_by: string;
}
