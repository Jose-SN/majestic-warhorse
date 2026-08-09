/** Assessment answers — /answer */

export interface AnswerRow {
  id?: string;
  course_id?: string;
  question_id?: string;
  answer?: string;
  submitted_by?: string;
  /** Attempt / revision number (1 on first save, increments on update) */
  version?: number;
  creation_date?: string;
  modification_date?: string;
  created_at?: string;
  updated_at?: string;
  submitted_at?: string;
}

export interface AnswerHistoryItem extends AnswerRow {
  /** Some backends nest the payload */
  data?: AnswerRow;
}

export interface AnswerHistoryAttempt {
  version: number;
  submittedAt?: string;
  answers: Array<{
    id?: string;
    question_id: string;
    answer: string | string[];
    raw?: string;
  }>;
}

export interface AnswerHistoryApiResponse {
  success?: boolean;
  message?: string;
  data?:
    | AnswerHistoryItem[]
    | {
        items?: AnswerHistoryItem[];
        history?: AnswerHistoryItem[];
        attempts?: AnswerHistoryAttempt[];
      };
}

export interface AnswerSavePayload {
  course_id: string;
  question_id: string;
  answer: string;
  submitted_by: string;
  /** First save starts at 1 when omitted by client; backend may set it */
  version?: number;
}

export interface AnswerUpdatePayload {
  id: string;
  course_id: string;
  question_id: string;
  answer: string;
  submitted_by: string;
  /** Next version after retry (e.g. 2) */
  version?: number;
  /** Optimistic lock against concurrent edits */
  expected_version?: number;
}
