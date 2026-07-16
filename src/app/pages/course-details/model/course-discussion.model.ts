/** API record — matches proposed `course_discussions` table / backend payload. */
export interface CourseDiscussionRecord {
  id: string;
  course_id: string;
  chapter_id?: string | null;
  organization_id?: string | null;
  comment: string;
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

export interface CourseDiscussionCreatePayload {
  course_id: string;
  chapter_id?: string;
  organization_id?: string;
  comment: string;
  created_by: string;
}

/** View model for the course details UI. */
export interface CourseDiscussionItem {
  id: string;
  author: string;
  avatarUrl?: string;
  chapterLabel: string;
  chapterTitle: string;
  comment: string;
  timeAgo: string;
}
