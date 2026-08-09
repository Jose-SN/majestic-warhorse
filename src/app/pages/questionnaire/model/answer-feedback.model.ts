/** Corporate assessment feedback — PUT /answers/:studentUserId/feedback */

export type FeedbackOutcome =
  | 'pass'
  | 'fail'
  | 'distinction'
  | 'incomplete'
  | 'needs_resubmission';

export type FeedbackGradeCode = 'FAIL' | 'PASS' | 'DIST';

export type FeedbackItemStatus = 'correct' | 'partial' | 'incorrect' | 'not_graded';

export type FeedbackVisibility = 'student_visible' | 'internal_only';

export type CorrectedAnswerType = 'single_choice' | 'multi_choice' | 'text';

export interface FeedbackScore {
  earned: number;
  max: number;
  percent: number;
  scale: 'points' | 'percent';
}

export interface FeedbackRubricCriterion {
  criterion_id: string;
  label: string;
  weight: number;
  score: number;
  max: number;
  comment?: string;
}

export interface FeedbackCorrectedAnswer {
  type: CorrectedAnswerType;
  value: string | string[];
}

export interface FeedbackItemPayload {
  question_id: string;
  answer_id?: string | null;
  status: FeedbackItemStatus;
  earned_score?: number;
  max_score?: number;
  teacher_comment?: string;
  corrected_answer?: FeedbackCorrectedAnswer | null;
  tags?: string[];
}

export interface FeedbackReviewPayload {
  outcome: FeedbackOutcome;
  grade_code?: FeedbackGradeCode | string;
  score?: FeedbackScore;
  rubric?: FeedbackRubricCriterion[];
  summary: string;
  private_notes?: string;
  visibility: FeedbackVisibility;
  requires_resubmission: boolean;
  resubmission_due_at?: string | null;
}

export interface AnswerFeedbackPayload {
  /** Organization scope (must match JWT org when both are present) */
  organization_id: string;
  /** Reviewer IAM user id (teacher / org admin publishing feedback) */
  reviewed_by_user_id: string;
  /** Reviewer role, e.g. teacher | organization */
  reviewed_by_role: string;
  /** Student-facing / audit display name for the reviewer */
  reviewed_by_display_name: string;
  course_id: string;
  /** Optional until attempts exist — one feedback stream per student+course */
  submission_id?: string | null;
  assessment?: {
    attempt_number?: number;
    submitted_at?: string;
    locale?: string;
  };
  review: FeedbackReviewPayload;
  item_feedback: FeedbackItemPayload[];
  notifications?: {
    notify_student?: boolean;
    channels?: Array<'in_app' | 'email'>;
  };
  metadata?: {
    source?: string;
    client_request_id?: string;
    reviewed_at?: string;
    /** Optimistic lock; mismatch → 409 */
    expected_version?: number;
  };
}

export interface AnswerFeedbackResponseData {
  feedback_id?: string;
  student_user_id?: string;
  organization_id?: string;
  course_id?: string;
  submission_id?: string | null;
  status?: 'draft' | 'published';
  review?: FeedbackReviewPayload;
  item_feedback?: FeedbackItemPayload[];
  item_feedback_count?: number;
  reviewed_by?: {
    user_id?: string;
    role?: string;
    display_name?: string;
  };
  reviewed_by_user_id?: string;
  reviewed_by_role?: string;
  reviewed_by_display_name?: string;
  published_at?: string;
  version?: number;
  notification?: {
    emailed?: boolean;
  };
  /** Optional prior published versions when API includes them on GET */
  history?: AnswerFeedbackHistoryItem[];
}

export interface AnswerFeedbackHistoryItem {
  /** Backend history row id */
  id?: string;
  feedback_id?: string;
  version?: number;
  status?: 'draft' | 'published';
  published_at?: string;
  created_at?: string;
  creation_date?: string;
  modification_date?: string;
  assessment?: {
    attempt_number?: number;
    submitted_at?: string;
    locale?: string;
  };
  review?: FeedbackReviewPayload;
  item_feedback?: FeedbackItemPayload[];
  item_feedback_count?: number;
  reviewed_by?: {
    user_id?: string;
    role?: string;
    display_name?: string;
  };
  reviewed_by_user_id?: string;
  reviewed_by_role?: string;
  reviewed_by_display_name?: string;
}

export interface AnswerFeedbackApiResponse {
  success?: boolean;
  message?: string;
  data?: AnswerFeedbackResponseData;
}

export interface AnswerFeedbackHistoryApiResponse {
  success?: boolean;
  message?: string;
  data?: AnswerFeedbackHistoryItem[] | { items?: AnswerFeedbackHistoryItem[]; history?: AnswerFeedbackHistoryItem[] };
}

export const GRADE_TO_OUTCOME: Record<FeedbackGradeCode, FeedbackOutcome> = {
  FAIL: 'fail',
  PASS: 'pass',
  DIST: 'distinction',
};

export const OUTCOME_TO_GRADE: Partial<Record<FeedbackOutcome, FeedbackGradeCode>> = {
  fail: 'FAIL',
  pass: 'PASS',
  distinction: 'DIST',
};
