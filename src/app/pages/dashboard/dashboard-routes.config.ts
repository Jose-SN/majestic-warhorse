/** Dashboard child routes — single source of truth for sidenav and programmatic navigation. */
export const DASHBOARD_NAV_ROUTES = {
  overview: '/dashboard/overview',
  aiMode: '/dashboard/ai-mode',
  courseOverview: '/dashboard/course-overview',
  courses: '/dashboard/courses',
  courseDetails: '/dashboard/course-details',
  account: '/dashboard/account',
  teachers: '/dashboard/teachers',
  students: '/dashboard/students',
  approval: '/dashboard/approval',
  studentApproval: '/dashboard/student-approval',
  approvalPending: '/dashboard/approval-pending',
  assignTeacher: '/dashboard/assign-teacher',
  inviteTeacher: '/dashboard/invite-teacher',
  inviteStudent: '/dashboard/invite-student',
  assessment: '/dashboard/assessment',
  switchOrg: '/org-picker',
} as const;

/** Route segments under `/dashboard/` that should highlight a nav item. */
export const DASHBOARD_NAV_ACTIVE_SEGMENTS = {
  overview: ['overview', 'course-overview'],
  aiMode: ['ai-mode'],
  account: ['account'],
  courses: ['courses', 'course-details'],
  teachers: ['teachers'],
  students: ['students'],
  approval: ['approval'],
  studentApproval: ['student-approval'],
  approvalPending: ['approval-pending'],
  assignTeacher: ['assign-teacher'],
  inviteTeacher: ['invite-teacher'],
  inviteStudent: ['invite-student'],
  assessment: ['assessment'],
} as const;

export function isDashboardNavActive(url: string, segments: readonly string[]): boolean {
  return segments.some((segment) => url.includes(`/dashboard/${segment}`));
}
