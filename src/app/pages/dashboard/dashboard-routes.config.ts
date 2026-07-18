/** Dashboard child routes — single source of truth for sidenav and programmatic navigation. */
export const DASHBOARD_NAV_ROUTES = {
  overview: '/dashboard/overview',
  aiMode: '/dashboard/ai-mode',
  courseOverview: '/dashboard/course-overview',
  courses: '/dashboard/courses',
  courseUpload: '/dashboard/course-upload',
  courseDetails: '/dashboard/course-details',
  account: '/dashboard/account',
  directory: '/dashboard/directory',
  teachers: '/dashboard/directory/teachers',
  students: '/dashboard/directory/students',
  manageTeacherStudents: (teacherId: string) =>
    `/dashboard/directory/teachers/${teacherId}/manage`,
  manageStudentTeachers: (studentId: string) =>
    `/dashboard/directory/students/${studentId}/manage`,
  approval: '/dashboard/approval',
  teacherApproval: '/dashboard/approval/teachers',
  studentApproval: '/dashboard/approval/students',
  approvalPending: '/dashboard/approval-pending',
  assignTeacher: '/dashboard/assign-teacher',
  inviteTeacher: '/dashboard/invite-teacher',
  inviteStudent: '/dashboard/invite-student',
  assessment: '/dashboard/assessment',
  switchOrg: '/org-picker',
} as const;

/** Route segments that show the grid + scanline backdrop in the main content area. */
export const DASHBOARD_TECHNICAL_BACKDROP_SEGMENTS = [
  'overview',
  'course-overview',
  'account',
  'ai-mode',
  'courses',
] as const;

/** Route segments under `/dashboard/` that should highlight a nav item. */
export const DASHBOARD_NAV_ACTIVE_SEGMENTS = {
  overview: ['overview', 'course-overview'],
  aiMode: ['ai-mode'],
  account: ['account'],
  courses: ['courses', 'course-details', 'course-upload'],
  directory: ['directory'],
  approval: ['approval'],
  approvalPending: ['approval-pending'],
  assignTeacher: ['assign-teacher'],
  inviteTeacher: ['invite-teacher'],
  inviteStudent: ['invite-student'],
  assessment: ['assessment'],
} as const;

export function isDashboardNavActive(url: string, segments: readonly string[]): boolean {
  return segments.some((segment) => url.includes(`/dashboard/${segment}`));
}
