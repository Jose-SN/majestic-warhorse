/** App shell child routes — sidenav + programmatic navigation (flat URLs). */
export const DASHBOARD_NAV_ROUTES = {
  overview: '/dashboard',
  aiMode: '/ai-mode',
  courseOverview: '/course-overview',
  courses: '/courses',
  courseUpload: '/course-upload',
  courseDetails: '/course-details',
  account: '/account',
  customizeApp: '/customize-app',
  directory: '/directory',
  teachers: '/directory/teachers',
  students: '/directory/students',
  manageTeacherStudents: (teacherId: string) =>
    `/directory/teachers/${teacherId}/manage`,
  manageStudentTeachers: (studentId: string) =>
    `/directory/students/${studentId}/manage`,
  approval: '/approval',
  teacherApproval: '/approval/teachers',
  studentApproval: '/approval/students',
  approvalPending: '/approval-pending',
  assignTeacher: '/assign-teacher',
  inviteTeacher: '/invite-teacher',
  inviteStudent: '/invite-student',
  assessment: '/assessment',
  switchOrg: '/org-picker',
} as const;

/** Route segments that show the grid + scanline backdrop in the main content area. */
export const DASHBOARD_TECHNICAL_BACKDROP_SEGMENTS = [
  'dashboard',
  'course-overview',
  'account',
  'customize-app',
  'ai-mode',
  'courses',
] as const;

/** Path segments that should highlight a nav item. */
export const DASHBOARD_NAV_ACTIVE_SEGMENTS = {
  overview: ['dashboard', 'course-overview'],
  aiMode: ['ai-mode'],
  account: ['account'],
  customizeApp: ['customize-app'],
  courses: ['courses', 'course-details', 'course-upload'],
  directory: ['directory'],
  approval: ['approval'],
  approvalPending: ['approval-pending'],
  assignTeacher: ['assign-teacher'],
  inviteTeacher: ['invite-teacher'],
  inviteStudent: ['invite-student'],
  assessment: ['assessment'],
} as const;

/** True when the current URL path matches any of the given first-level segments. */
export function isDashboardNavActive(url: string, segments: readonly string[]): boolean {
  const path = url.split('?')[0].split('#')[0];
  return segments.some((segment) => {
    if (segment === 'dashboard') {
      return path === '/dashboard' || path === '/';
    }
    return path === `/${segment}` || path.startsWith(`/${segment}/`);
  });
}
